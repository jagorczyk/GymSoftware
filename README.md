# Gymlos — Gym Management SaaS

Multi-tenant platform for gym owners: SaaS subscriptions, multi-location management, employees with permissions, passes, lockers, POS, schedules, CRM, and a client portal for bookings and payments.

**Stack:** Java 21 · Spring Boot 4 · PostgreSQL · Flyway · Stripe · React 19 · TypeScript · Vite · Tailwind

---

## Roles

| Role | Access |
|---|---|
| `SUPER_ADMIN` | SaaS plans, subscriptions, users |
| `OWNER` | Owned gyms, staff, config, analytics, CRM |
| `EMPLOYEE` | Assigned gyms, scoped by `EmployeePermission` |
| `GUEST` | Client portal — passes, classes, trainers |

Auth: `Authorization: Bearer <jwt>` on protected routes.

---

## Quick Start

### Local

```bash
# DB
createdb gym_management

# Backend (port 8080)
export JWT_SECRET=your-very-long-jwt-secret-key-min-32-chars
mvn spring-boot:run

# Frontend (port 5173)
cd frontend && npm install && npm run dev
```

### Docker

```bash
docker compose up -d --build
```

If build fails with `failed to fetch anonymous token` / `auth.docker.io ... 404`, Docker Hub is unreachable from the host (not a bad image tag). On the server run:

```bash
curl -fsS "https://auth.docker.io/token?service=registry.docker.io&scope=repository:library/maven:pull" | head
docker pull hello-world
```

If `curl` fails, check `/etc/docker/daemon.json` for broken `registry-mirrors`, restart Docker (`sudo systemctl restart docker`), then retry. `docker login` can also help on rate-limited hosts.

| Service | Port |
|---|---|
| Frontend | 80, 443 |
| Backend | 8080 |
| PostgreSQL | 5432 |

Periodic cleanup on small servers:

```bash
docker builder prune -a -f
docker system prune -f
```

Do **not** run `docker volume prune` — it can delete `postgres_data`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `JWT_SECRET` | JWT signing key (min. 32 chars in production) |
| `JWT_REQUIRE_SECURE_SECRET` | Set `true` in production to reject default JWT secret |
| `UPLOAD_MAX_BYTES` | Max image upload size (default 5 MB) |
| `AUTH_RATE_LIMIT_MAX` | Max auth requests per IP per window (default 30) |
| `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` | Google Sign-In |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments |
| `FRONTEND_URL` | Public URL (emails, redirects) |
| `SMTP_*` | Outbound email |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Database |

See `docker-compose.yml` and `application.properties` for defaults.

---

## SaaS Plan Features

Owner modules gated by plan flags: `SCHEDULE`, `WORK_SCHEDULE`, `TRAINER_BOOKINGS`, `LOCKERS`, `INVENTORY`, `ANALYTICS`, `CRM`, `CLASS_RATINGS`, `NOTIFICATIONS`, `SALES_REPORT`, `AUDIT_LOG`.

Always available: dashboard, gyms, guests, employees, ranks, pass types, passes.

---

## API Overview

Base: `/api` · Dates: ISO-8601 · Errors: JSON with `error` / `message`

### Auth — `/api/auth` (public)

| Method | Path | Body → Response |
|---|---|---|
| POST | `/register` | `{ email, password, role }` → `{ token }` |
| POST | `/login` | `{ email, password }` → `{ token }` |
| POST | `/google` | `{ idToken, role? }` → `{ token }` |
| POST | `/verify-email` | `{ email, code }` → `{ token }` |
| POST | `/resend-verification` | `{ email }` → 200 |

### Tenant onboarding — `/api/auth/tenant` (public)

| Method | Path | Notes |
|---|---|---|
| GET | `/plans` | `SaaSPlan[]` |
| POST | `/register` | Owner + gym + Stripe — see `TenantRegistrationRequest` |

### Public — `/api/public/gyms`

| Method | Path | Response |
|---|---|---|
| GET | `/subdomain/check?gymName=` | `{ subdomain, available }` |
| GET | `/subdomain/{subdomain}` | Gym list for tenant landing |

### Upload — `/api/upload`

| Method | Path | Response |
|---|---|---|
| POST | `/image` | multipart `file` → `{ url: "/uploads/images/..." }` |

### Owner — `/api/owner` (`OWNER`)

Gym CRUD, employees, ranks, pass types, guests, passes, lockers, calendar, work schedule, products, sales report, notifications, audit log, trainers, analytics, subscription/Stripe checkout.

Key paths: `/gyms`, `/gyms/{gymId}/details`, `/gyms/{gymId}/dashboard-stats`, `/gyms/{gymId}/guests?page=&size=&q=`, `/gyms/{gymId}/subscription`, `/gyms/{gymId}/analytics`, `/gyms/{gymId}/crm/campaigns`.

`GET /gyms/{gymId}/details` returns gym + employees + passes + lockers + logs + pass types (guests are paginated via `/guests`).

### Super admin — `/api/admin/saas` (`SUPER_ADMIN`)

| Method | Path | Notes |
|---|---|---|
| GET | `/subscriptions` | All gym subscriptions |
| POST | `/subscriptions/{id}/extend` | `{ days, reactivate }` — extend billing period |
| POST | `/subscriptions/{id}/plan` | `{ saasPlanId }` |
| POST | `/subscriptions/{id}/status` | `{ status }` |
| POST | `/subscriptions/{id}/cancel` | Cancel subscription |

### CRM — `/api/owner/gyms/{gymId}/crm` (`OWNER`, `CRM` flag)

| Method | Path | Body |
|---|---|---|
| GET | `/campaigns` | — |
| POST | `/campaigns` | `{ subject, body, targetSegment, scheduledAt?, imageUrl? }` |

Segments: `ALL_GUESTS`, `ACTIVE_PASSES`, `EXPIRED_PASSES`, `NO_PASS`. Body supports `{{imie}}`, `{{nazwisko}}`, `{{email}}`, `{{telefon}}`, `**bold**`.

### Group classes — `/api/owner|employee/gyms/{gymId}/classes`

List/create/update/delete classes, reservations, attendance. Query: `from`, `to` (required on list).

### Employee — `/api/employee` (`EMPLOYEE`)

Live dashboard, guests, check-in/out, QR scan, pass sales, lockers, POS (`SELL_PRODUCTS`), calendar, work schedule, trainer profile (`PERSONAL_TRAINER`).

`POST /gyms/{gymId}/scan-checkin` — `{ token }` → `{ status, guestName, guestId }`

### Client — `/api/client` (`GUEST`)

Gyms, join, dashboard, buy passes (Stripe), classes, trainers, bookings, QR check-in token, invoice PDF.

### Super admin — `/api/admin/saas`

Plans CRUD, subscriptions, users, stats. `GET /plans` is public.

### Stripe — `/api/stripe/webhook` (public, signed)

Handles checkout and subscription lifecycle events.

---

## Common Response Shapes

```json
// GymSummary
{ "id": 1, "name": "...", "address": "...", "city": "...", "postalCode": "00-001", "nip": "1234567890", "themeColor": "#2155e5", "subdomain": "justgym" }

// GuestView
{ "id": 1, "firstName": "...", "lastName": "...", "email": "...", "hasActivePass": true, "isPresent": false, "hasLocker": false, "activePassEndDate": "2026-07-01", "avatarUrl": null }

// PassView
{ "id": 1, "guestId": 1, "passType": "Monthly", "status": "ACTIVE", "startDate": "2026-06-01", "endDate": "2026-07-01", "price": 149.00 }

// SaaSPlan
{ "id": 1, "name": "Pro", "price": 99.00, "features": "...", "active": true, "featureFlags": ["SCHEDULE", "CRM"] }
```

Full DTO definitions: `src/main/java/com/jagorczyk/gymManagement/api/dto/`.

---

## Other

- **WebSocket:** `/ws-gym` — live employee dashboard (STOMP)
- **Cron:** expire passes (01:00), expiring notifications (08:00), CRM campaigns (every minute)
- **Migrations:** `src/main/resources/db/migration/`
- **Tests:** `mvn test` · `cd frontend && npm test`

---

## Frontend Routes

| Prefix | Role |
|---|---|
| `/owner/*` | Owner |
| `/employee/*` | Employee |
| `/client/*` | Guest |
| `/superadmin/*` | Super admin |

Source: `frontend/src/` — API client in `api.ts`, routes in `routes/`.
