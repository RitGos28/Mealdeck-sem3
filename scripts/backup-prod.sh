#!/usr/bin/env bash
# Nightly backup of the production database and uploads, run from the
# production host's crontab (not from CI):
#
#   30 22 * * * $HOME/mealdeck-backup/backup-prod.sh >> /mnt/nvme/mealdeck-backups/backup.log 2>&1
#
# (22:30 UTC = 04:00 IST.) It runs outside the containers, so it still works
# when the app is broken. Copies go to two disks other than the one MySQL
# lives on:
#   - DAILY_DIR: every night, kept KEEP_DAYS days
#   - WEEKLY_DIR: Sunday's copy, kept KEEP_WEEKS weeks
#
# Restore the database:
#   zcat db-<time>.sql.gz | docker exec -i mealdeck-mysql-1 \
#     sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"'
#   then restart the backend so Hibernate brings the schema up to date.
# Restore uploads:
#   docker run --rm -i -v mealdeck_uploads_data:/u alpine tar -C /u -xzf - < uploads-<time>.tgz
set -euo pipefail

DAILY_DIR="${DAILY_DIR:-/mnt/nvme/mealdeck-backups}"
WEEKLY_DIR="${WEEKLY_DIR:-/nas/ritwik/backups/mealdeck}"
KEEP_DAYS="${KEEP_DAYS:-14}"
KEEP_WEEKS="${KEEP_WEEKS:-8}"
MYSQL_CONTAINER="${MYSQL_CONTAINER:-mealdeck-mysql-1}"
UPLOADS_VOLUME="${UPLOADS_VOLUME:-mealdeck_uploads_data}"

ts="$(date -u +%Y%m%dT%H%MZ)"
mkdir -p "$DAILY_DIR"
db="$DAILY_DIR/db-$ts.sql.gz"
up="$DAILY_DIR/uploads-$ts.tgz"

# The password stays inside the container; --databases adds CREATE DATABASE
# and USE, so the file restores without naming the database.
docker exec "$MYSQL_CONTAINER" sh -c \
  'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --databases "$MYSQL_DATABASE" 2>/dev/null' \
  | gzip > "$db.part"
# A dump cut short (container restarting, disk full) lacks the last line.
if ! zcat "$db.part" | tail -n 1 | grep -q '^-- Dump completed'; then
  rm -f "$db.part"
  echo "$(date -u +%FT%TZ) FAILED: database dump incomplete" >&2
  exit 1
fi
mv "$db.part" "$db"

docker run --rm -v "$UPLOADS_VOLUME":/u:ro alpine tar -C /u -czf - . > "$up.part"
mv "$up.part" "$up"

find "$DAILY_DIR" -maxdepth 1 \( -name 'db-*.sql.gz' -o -name 'uploads-*.tgz' \) -mtime +"$KEEP_DAYS" -delete

if [ "$(date -u +%u)" = 7 ] || [ "${FORCE_WEEKLY:-}" = 1 ]; then
  mkdir -p "$WEEKLY_DIR"
  cp "$db" "$up" "$WEEKLY_DIR"/
  find "$WEEKLY_DIR" -maxdepth 1 \( -name 'db-*.sql.gz' -o -name 'uploads-*.tgz' \) -mtime +"$((KEEP_WEEKS * 7))" -delete
fi

echo "$(date -u +%FT%TZ) ok $(du -h "$db" | cut -f1) db, $(du -h "$up" | cut -f1) uploads"
