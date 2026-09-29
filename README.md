# Mealdeck-sem3
MealDeck

## Run with Docker (full stack)

```bash
cp .env.example .env      # then set real passwords
docker compose up --build # http://localhost (HOST_PORT in .env)
```

Four containers: `nginx` (the only published port) routes `/api/*` to the Spring Boot `backend` and everything else to the Next.js `frontend`; the backend talks to `mysql`, whose data lives in the `mysql_data` volume and survives `docker compose down`. Use `docker compose down -v` to wipe it.

## Run without Docker

Run with `./run.sh --demo` (in-memory H2, no MySQL/`.env` needed). Either way, an empty database is seeded with stalls, a vendor login, an admin login, and a student login:

| Role    | Email                    | Password    |
|---------|---------------------------|-------------|
| Vendor  | bistro@mealdeck.in        | vendor123   |
| Admin   | admin@mealdeck.in         | admin123    |
| Student | student@bennett.edu.in    | student123  |

Vendor/admin logins use a `@mealdeck.in` identity (see `Vendor.realEmail` / `Admin.realEmail`, currently unused placeholders for future OTP delivery); student signup only accepts `@bennett.edu.in` addresses.
