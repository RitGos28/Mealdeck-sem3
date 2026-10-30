# MealDeck

Pre-order food from Bennett University's campus stalls, pick a pickup slot, and watch the queue move live. Built as a semester-3 DevOps course project.

**Live:** https://mealdeck.in

## Features

**Students**
- Browse every stall's menu, with veg/non-veg markers and search.
- **Sign up with a Bennett email:** the address must end in `@bennett.edu.in`, and a 6-digit code is emailed (through Resend) to prove it's yours. Codes expire after 5 minutes.
- **Pre-order** from one or more stalls, each with its own 15-minute pickup slot. Ordering needs a login. Your name and contact come from your account, and the bag is kept while you log in.
- **Live queue:** the order page shows "N orders ahead of you" and flips to "Ready now!" the moment the stall marks it ready, with no refresh.
- **Live slot fill levels** at checkout (for example "11/15"). Full slots grey out as they fill.
- Report an item as out of stock. Three different students hide it until the stall restocks or the day resets at midnight.

**Vendors**
- Today's orders, grouped by pickup slot, appear instantly as they're placed.
- Move orders along: accept, ready, picked up. A ready order not collected within 15 minutes becomes a no-show automatically.
- Set **orders per slot** (1-200, default 15), opening hours and "closed today", and manage menu items.
- **Pause new orders** during a rush. The stall stays open and keeps working through its existing orders, while students see "Pre-orders paused" and the slots grey out live. The pause lifts itself at midnight; "closed today" stays on until it's turned off by hand.
- **Order history:** pick any past day to see its orders, read-only, with a summary of orders, pickups, no-shows, cancellations and money collected.

A no-show keeps its place in its slot's count. The kitchen made that food, and by the time an order becomes a no-show (15 minutes after it was ready), its slot has already started and can't be booked anyway. So freeing the place wouldn't give anyone a usable slot.

**Admins**
- Manage all stalls, vendors and students, and see report analytics.

## Architecture

```
browser ──► Cloudflare ──► cloudflared tunnel ──► nginx :8081 ─┬─► Next.js frontend (:3000)
                                                               └─► /api/*  Spring Boot backend (:8080) ──► MySQL
```

- **nginx** is the only container with a published port. `/api/*`, including the `/api/ws` WebSocket, goes to the backend, and everything else goes to the frontend. Everything is served from one origin, so the backend needs no CORS setup.
- **Backend:** Spring Boot 4 (Java 21), Spring Data JPA, Spring Security (session cookie), and STOMP over WebSocket for the live queue (`/topic/stalls/{id}/queue`). The queue topic is public, so it never carries names or phone numbers. Browsers can subscribe but not send.
- **Frontend:** Next.js (App Router) with Tailwind.
- **Database:** MySQL 8.4 in production. An in-memory H2 database is used for tests and `./run.sh --demo`.

## Run it locally

### Full stack with Docker

```bash
cp .env.example .env          # set real passwords; Resend key optional
docker compose up --build     # http://localhost (HOST_PORT in .env)
```

There are four containers: nginx, frontend, backend and MySQL. Data lives in the `mysql_data` volume and survives `docker compose down`. To wipe it, use `docker compose down -v`.

### Without Docker

```bash
./run.sh --demo               # backend on in-memory H2, no MySQL or .env needed
cd frontend && npm install && npm run dev
```

For live updates under `next dev`, set `NEXT_PUBLIC_WS_URL=ws://localhost:8080/api/ws`, since the dev server can't proxy WebSockets.

### Demo logins

With the `demo` profile (`./run.sh --demo`, and the tests), an empty database is seeded with stalls and these accounts:

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Vendor  | bistro@mealdeck.in     | vendor123  |
| Admin   | admin@mealdeck.in      | admin123   |
| Student | student@bennett.edu.in | student123 |

These passwords are public, so the seeding never runs in production. A production database starts empty apart from one admin, created from `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in the env file (see `.env.example`); add stalls and vendors from the admin dashboard.

### Environment variables

| Variable | Used for |
|---|---|
| `MYSQL_ROOT_PASSWORD`, `DB_USERNAME`, `DB_PASSWORD` | MySQL |
| `HOST_PORT` | Port nginx publishes (default 80) |
| `RESEND_API_KEY` | Emailing sign-up codes. If it's empty or still the `<resend api key>` placeholder, codes are written to the backend log instead. |
| `MAIL_FROM` | Sender address; its domain must be verified in Resend |
| `WS_ALLOWED_ORIGINS` | Pages allowed to open the live-queue socket (defaults cover mealdeck.in, localhost and the Tailscale address) |

## Tests

```bash
cd backend && SPRING_PROFILES_ACTIVE=demo ./mvnw test     # 68 tests, H2, about 10s
cd frontend && npm run lint && npm run build
```

The backend tests cover:
- slot capacity, including two students racing for the last spot
- queue snapshots and the push that follows a committed change
- sign-up codes: expiry, wrong-guess lockout and rate limits
- which roles can reach which routes
- checkout and vendor stall scoping
- out-of-stock voting

## CI/CD

`.github/workflows/deploy.yml` runs on a **self-hosted GitHub Actions runner** on the production server:

1. **On every push and PR:** backend tests, then frontend lint and build. PRs from forks are skipped, since the runner is the production machine. `main` only accepts PRs whose `test` check passed.
2. **On merge to `main`:**
   - `docker compose up -d --build --wait` rebuilds whatever changed and waits for every health check.
   - nginx reloads its config.
   - A smoke test checks the API answers and `/api/ws` upgrades to a WebSocket.
   - Old images are pruned.

The production env file lives at `~/mealdeck.env` on the server, outside the checkout.

**Why build on the server and not push to a registry?** The roadmap planned GHCR plus an SSH deploy. Building in place on the runner means:
- there's no registry to run or pay for
- no SSH key is stored in GitHub
- the server never accepts an incoming connection from GitHub, since the runner calls out instead

Docker layer caching keeps rebuilds fast. After a source-only change, the deploy log shows the dependency layers as `CACHED`.

## Project layout

```
backend/    Spring Boot API (model, repository, service, web, security, config)
frontend/   Next.js app (app/ routes, components/, lib/)
nginx/      Reverse proxy config, mounted into the nginx container
.github/    CI/CD workflow
```

The 12-week roadmap this follows lives outside the repo, in `ROADMAP.md` in the parent folder.
