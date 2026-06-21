# Gymlos — Gym Management SaaS Platform

Gymlos is a multi-tenant fitness club management platform. Gym owners subscribe to SaaS plans, manage one or more gym locations, hire employees with granular permissions, and operate day-to-day workflows (passes, lockers, POS, schedules, CRM). Clients book classes and personal training; employees run reception and sales; super admins manage platform-wide plans and subscriptions.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture](#architecture)
3. [User Roles](#user-roles)
4. [SaaS Plans & Feature Flags](#saas-plans--feature-flags)
5. [Prerequisites](#prerequisites)
6. [Local Development](#local-development)
7. [Docker Deployment](#docker-deployment)
8. [Environment Variables](#environment-variables)
9. [Authentication](#authentication)
10. [Shared Types & Enums](#shared-types--enums)
11. [REST API Reference](#rest-api-reference)
12. [WebSocket](#websocket)
13. [File Uploads](#file-uploads)
14. [Scheduled Jobs](#scheduled-jobs)
15. [Frontend Structure](#frontend-structure)
16. [Testing](#testing)
17. [Server Maintenance](#server-maintenance)

---

## Technology Stack

### Backend
| Technology | Purpose |
|---|---|
| Java 21 | Runtime |
| Spring Boot 3 | REST API, DI, scheduling |
| Spring Security + JWT | Stateless authentication & RBAC |
| Spring Data JPA | PostgreSQL persistence |
| Flyway | Schema migrations (`src/main/resources/db/migration`) |
| Stripe | SaaS subscriptions & client pass payments |
| JavaMail | Verification emails & CRM campaigns |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | SPA |
| Vite | Dev server & production build |
| Tailwind CSS | Styling |
| React Router v6 | Role-based routing |
| STOMP over WebSocket | Live employee dashboard updates |

### Infrastructure
| Technology | Purpose |
|---|---|
| PostgreSQL 15 | Primary database |
| Docker Compose | Production-style deployment (`db`, `backend`, `frontend`) |
| Nginx (in frontend image) | HTTPS termination & static assets |

---

## Architecture

```
┌─────────────┐     HTTPS/REST      ┌──────────────┐     JDBC      ┌────────────┐
│   React SPA │ ◄─────────────────► │ Spring Boot  │ ◄───────────► │ PostgreSQL │
│  (Vite/Nginx)│     WebSocket       │   REST API   │               │            │
└─────────────┘                     └──────────────┘               └────────────┘
                                           │
                                    Stripe webhooks
                                    SMTP (email)
```

- **Multi-tenant model:** Each `OWNER` owns gyms. Employees and guests are scoped to a gym. Super admins operate at platform level.
- **Subdomains:** Gyms can have a `subdomain` (e.g. `justgym.gymlos.pl`). Owners and employees are redirected to their gym's subdomain after login. Public gym discovery uses `/api/public/gyms/subdomain/{subdomain}`.
- **Plan gating:** Owner API routes under `/api/owner/gyms/{gymId}/…` can return `403` when the gym's SaaS plan does not include the required module (see [SaaS Plans & Feature Flags](#saas-plans--feature-flags)).
- **Audit trail:** Sensitive employee actions are stored in `audit_logs` and exposed to owners (when `AUDIT_LOG` feature is enabled).

---

## User Roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Platform operator. Manages SaaS plans, subscriptions, and all users. |
| `OWNER` | Gym chain administrator. Full control over owned gyms. |
| `EMPLOYEE` | Staff member. Access limited by gym assignment and `EmployeePermission` set. |
| `GUEST` | Gym client. Books classes, buys passes, books trainers. |

---

## SaaS Plans & Feature Flags

Plans are stored in `saas_plans` with a JSON `feature_flags` array. Super admins configure flags via `/api/admin/saas/plans`.

### `SaaSPlanFeature` values

| Flag | Gated owner modules |
|---|---|
| `SCHEDULE` | Calendar / group class schedule |
| `WORK_SCHEDULE` | Employee work schedule |
| `TRAINER_BOOKINGS` | Personal trainers & bookings |
| `LOCKERS` | Locker management |
| `INVENTORY` | Products & POS inventory |
| `ANALYTICS` | Analytics dashboard |
| `CRM` | Marketing & email campaigns |
| `CLASS_RATINGS` | Class ratings |
| `NOTIFICATIONS` | Expiring-pass notifications |
| `SALES_REPORT` | Sales reports |
| `AUDIT_LOG` | Audit history |

**Always available** (no flag required): dashboard, gym list, guests, employees, ranks, pass types, passes.

### `SaaSPlan` response shape

```json
{
  "id": 1,
  "name": "Pro",
  "price": 99.00,
  "stripeProductId": "prod_xxx",
  "stripePriceId": "price_xxx",
  "features": "Full-featured plan for growing gyms",
  "active": true,
  "featureFlags": ["SCHEDULE", "CRM", "ANALYTICS"]
}
```

---

## Prerequisites

- Java 21 JDK
- Maven 3.9+
- Node.js 20+
- PostgreSQL 14+ (or Docker)
- Optional: Stripe account, SMTP credentials, Google OAuth client ID

---

## Local Development

### 1. Database

```sql
CREATE DATABASE gym_management;
```

### 2. Backend

```bash
export DB_URL=jdbc:postgresql://localhost:5432/gym_management
export DB_USERNAME=postgres
export DB_PASSWORD=root
export JWT_SECRET=your-very-long-jwt-secret-key-min-32-chars

mvn spring-boot:run
```

API: `http://localhost:8080`  
Health: `GET /actuator/health` → `{"status":"UP"}`

Flyway runs migrations automatically on startup.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`  
Vite proxies `/api` and `/uploads` to `http://localhost:8080`.

---

## Docker Deployment

```bash
git pull
docker compose up -d --build
```

Services:
| Service | Container | Ports |
|---|---|---|
| `db` | `gym-db` | 5432 |
| `backend` | `gym-backend` | 8080 |
| `frontend` | `gym-frontend` | 80, 443 |

PostgreSQL data persists in the `gymsoftware_postgres_data` volume.

### Recommended deploy workflow

```bash
# Normal deploy (uses build cache)
docker compose up -d --build

# Periodic cleanup (frees build cache — can be many GB)
docker builder prune -a -f
docker system prune -f
```

Avoid `--no-cache` on every deploy unless debugging build issues. See [Server Maintenance](#server-maintenance).

---

## Environment Variables

### Backend (`docker-compose.yml` / shell)

| Variable | Description | Default |
|---|---|---|
| `DB_URL` | JDBC URL | `jdbc:postgresql://localhost:5432/gym_management` |
| `DB_USERNAME` | DB user | `postgres` |
| `DB_PASSWORD` | DB password | `root` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | placeholder |
| `JWT_EXPIRATION_MINUTES` | Token TTL | `60` |
| `GOOGLE_CLIENT_ID` | Google Sign-In client ID | empty |
| `STRIPE_SECRET_KEY` | Stripe API key | placeholder |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | placeholder |
| `STRIPE_SUCCESS_URL` | Checkout success redirect | localhost URL |
| `STRIPE_CANCEL_URL` | Checkout cancel redirect | localhost URL |
| `SMTP_HOST` / `SMTP_PORT` | Mail server | Gmail defaults |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | SMTP credentials | empty |
| `FRONTEND_URL` | Public site URL (emails, Stripe redirects) | `http://localhost:5173` |
| `NOTIFICATIONS_EMAIL_ENABLED` | Send expiring-pass emails | `false` |

### Frontend build args

| Variable | Description |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google Sign-In (baked into build) |

---

## Authentication

All protected endpoints require:

```http
Authorization: Bearer <jwt>
```

### Register

`POST /api/auth/register` — **201 Created**

**Request:**
```json
{
  "email": "owner@example.com",
  "password": "securePassword123",
  "role": "OWNER"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Roles: `OWNER`, `EMPLOYEE`, `GUEST` (registration is typically `OWNER` or `GUEST`).

### Login

`POST /api/auth/login`

**Request:**
```json
{
  "email": "owner@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Google Sign-In

`POST /api/auth/google`

**Request:**
```json
{
  "idToken": "<google-id-token>",
  "role": "OWNER"
}
```

`role` is optional on login; required when registering a new account.

### Verify email

`POST /api/auth/verify-email`

**Request:**
```json
{
  "email": "owner@example.com",
  "code": "123456"
}
```

**Response:** `{ "token": "..." }`

### Resend verification

`POST /api/auth/resend-verification`

**Request:**
```json
{
  "email": "owner@example.com"
}
```

**Response:** empty body, `200 OK`

### Tenant registration (new gym + owner + Stripe)

`POST /api/auth/tenant/register`

**Request:**
```json
{
  "ownerFirstName": "Jan",
  "ownerLastName": "Kowalski",
  "ownerEmail": "jan@example.com",
  "ownerPassword": "securePassword123",
  "googleIdToken": null,
  "saasPlanId": 2,
  "gymName": "Just Gym",
  "gymCity": "Warsaw",
  "gymAddress": "ul. Sportowa 1",
  "gymPostalCode": "00-001",
  "gymNip": "1234567890"
}
```

Either `ownerPassword` or `googleIdToken` must be provided.

**Response (success):**
```json
{
  "status": "ok"
}
```

**Response (error):**
```json
{
  "error": "Subdomain already taken"
}
```

### Error format

Validation and business errors typically return JSON with an `error` or `message` field and appropriate HTTP status (`400`, `403`, `404`, `409`).

---

## Shared Types & Enums

### `PassStatus`
`ACTIVE` | `EXPIRED` | `CANCELLED` | `FROZEN`

### `LockerStatus`
`AVAILABLE` | `OCCUPIED`

### `SubscriptionStatus`
`TRIAL` | `ACTIVE` | `PAST_DUE` | `CANCELED` | `UNPAID`

### `EmployeePermission`
`VIEW_DASHBOARD` | `MANAGE_GUESTS` | `SELL_PASSES` | `MANAGE_LOCKERS` | `CREATE_LOCKERS` | `MANAGE_PASS_TYPES` | `MANAGE_SCHEDULE` | `MANAGE_WORK_SCHEDULE` | `MANAGE_CLASSES` | `MANAGE_PRODUCTS` | `SELL_PRODUCTS` | `PERSONAL_TRAINER`

### `WorkScheduleEntryType`
`SHIFT` | `VACATION` | `SICK_LEAVE` | `DAY_OFF` | `TRAINING` | `OTHER`

### `ClassReservationStatus`
`RESERVED` | `CANCELLED` | `ATTENDED` | `NO_SHOW` | `WAITLISTED`

### Date/time formats
- Dates: `YYYY-MM-DD` (ISO-8601)
- Date-times: `YYYY-MM-DDTHH:mm:ss` (ISO-8601, server timezone)

---

## REST API Reference

Base URL: `/api`  
Unless noted, endpoints require a valid JWT.

---

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register user |
| POST | `/login` | Public | Login |
| POST | `/google` | Public | Google OAuth |
| POST | `/verify-email` | Public | Verify email code |
| POST | `/resend-verification` | Public | Resend verification code |

---

### Tenant registration — `/api/auth/tenant`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/plans` | Public | List active SaaS plans for registration |
| POST | `/register` | Public | Register owner + gym + subscription |

`GET /plans` returns `SaaSPlan[]` (same shape as admin plans).

---

### Public gyms — `/api/public/gyms`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/subdomain/check` | Public | Check subdomain availability |
| GET | `/subdomain/{subdomain}` | Public | List gyms on a tenant subdomain |

**`GET /subdomain/check?gymName=Just Gym&excludeGymId=1`**

**Response:**
```json
{
  "subdomain": "justgym",
  "available": true
}
```

**`GET /subdomain/justgym`**

**Response:**
```json
[
  {
    "id": 1,
    "name": "Just Gym Centrum",
    "address": "ul. Sportowa 1",
    "city": "Warsaw",
    "themeColor": "#2155e5",
    "subdomain": "justgym"
  }
]
```

---

### Upload — `/api/upload`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/image` | JWT required | Upload image file |

**Request:** `multipart/form-data`, field name `file` (image, max 5 MB recommended on frontend).

**Response:**
```json
{
  "url": "/uploads/images/a1b2c3d4-uuid.jpg"
}
```

Files are served at `/uploads/**` from the backend `uploads/` directory.

---

### Owner — `/api/owner` · Role: `OWNER`

#### Gyms

| Method | Path | Description |
|---|---|---|
| GET | `/gyms` | List owner's gyms |
| GET | `/gyms/{gymId}/details` | Full gym dashboard payload |
| POST | `/gyms` | Create gym |
| PUT | `/gyms/{gymId}` | Update gym |
| PUT | `/gyms/{gymId}/theme` | Update theme color only |
| DELETE | `/gyms/{gymId}` | Delete gym |
| POST | `/gyms/{gymId}/checkout` | Start Stripe SaaS checkout |
| GET | `/gyms/{gymId}/subscription` | Current SaaS subscription |
| POST | `/gyms/{gymId}/subscription/portal` | Stripe customer portal URL |

**`GymSummary`:**
```json
{
  "id": 1,
  "name": "Just Gym",
  "address": "ul. Sportowa 1",
  "city": "Warsaw",
  "postalCode": "00-001",
  "nip": "1234567890",
  "themeColor": "#2155e5",
  "subdomain": "justgym"
}
```

**`POST /gyms` request:**
```json
{
  "name": "Just Gym",
  "address": "ul. Sportowa 1",
  "city": "Warsaw",
  "postalCode": "00-001",
  "nip": "1234567890",
  "themeColor": "#2155e5"
}
```

**`GET /gyms/{gymId}/details` response (`OwnerGymDetails`):**
```json
{
  "gym": { "id": 1, "name": "Just Gym", "address": "...", "city": "...", "postalCode": "00-001", "nip": "1234567890", "themeColor": "#2155e5", "subdomain": "justgym" },
  "guests": [ { "id": 1, "firstName": "Anna", "lastName": "Nowak", "email": "anna@example.com", "phone": null, "notes": null, "hasActivePass": true, "isPresent": false, "hasLocker": false, "activePassEndDate": "2026-07-01", "avatarUrl": null } ],
  "employees": [ { "id": 1, "userId": 2, "email": "staff@example.com", "firstName": "Piotr", "lastName": "Wiśniewski", "permissions": ["SELL_PASSES"], "rankId": 1, "rankName": "Recepcja", "avatarUrl": null } ],
  "passes": [ { "id": 1, "guestId": 1, "passType": "Miesięczny", "status": "ACTIVE", "startDate": "2026-06-01", "endDate": "2026-07-01", "price": 149.00 } ],
  "lockers": [ { "id": 1, "lockerNumber": "A01", "status": "AVAILABLE", "guestId": null } ],
  "logs": [ { "id": 1, "action": "PASS_SOLD", "payload": "...", "createdAt": "2026-06-21T10:00:00", "actorEmail": "staff@example.com" } ],
  "passTypes": [ { "id": 1, "name": "Miesięczny", "price": 149.00, "durationDays": 30 } ]
}
```

**`POST /gyms/{gymId}/checkout` response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

**`GymSubscriptionView`:**
```json
{
  "id": 1,
  "saasPlanId": 2,
  "saasPlanName": "Pro",
  "status": "ACTIVE",
  "currentPeriodStart": "2026-06-01T00:00:00",
  "currentPeriodEnd": "2026-07-01T00:00:00",
  "featureFlags": ["SCHEDULE", "CRM", "ANALYTICS"]
}
```

#### Employees

| Method | Path | Description |
|---|---|---|
| POST | `/gyms/{gymId}/employees` | Hire employee |
| PUT | `/gyms/{gymId}/employees/{employeeId}` | Update employee |
| DELETE | `/gyms/{gymId}/employees/{employeeId}` | Remove employee |

**`POST /gyms/{gymId}/employees` request:**
```json
{
  "email": "staff@example.com",
  "password": "tempPassword123",
  "firstName": "Piotr",
  "lastName": "Wiśniewski",
  "permissions": ["SELL_PASSES", "MANAGE_GUESTS"],
  "rankId": 1,
  "avatarUrl": "/uploads/images/avatar.jpg"
}
```

**`EmployeeView` response:** same fields as in `OwnerGymDetails.employees[]`.

#### Ranks

| Method | Path | Description |
|---|---|---|
| GET | `/gyms/{gymId}/ranks` | List ranks |
| POST | `/gyms/{gymId}/ranks` | Create rank |
| PUT | `/gyms/{gymId}/ranks/{rankId}` | Update rank |
| DELETE | `/gyms/{gymId}/ranks/{rankId}` | Delete rank |

**Request (`CreateRankRequest` / `UpdateRankRequest`):**
```json
{
  "name": "Recepcja",
  "permissions": ["SELL_PASSES", "MANAGE_GUESTS", "VIEW_DASHBOARD"]
}
```

**`RankView` response:**
```json
{
  "id": 1,
  "name": "Recepcja",
  "permissions": ["SELL_PASSES", "MANAGE_GUESTS"]
}
```

#### Pass types

| Method | Path | Description |
|---|---|---|
| POST | `/gyms/{gymId}/pass-types` | Create pass type |
| PUT | `/gyms/{gymId}/pass-types/{passTypeId}` | Update pass type |
| DELETE | `/gyms/{gymId}/pass-types/{passTypeId}` | Delete pass type |

**Request:**
```json
{
  "name": "Miesięczny",
  "price": 149.00,
  "durationDays": 30
}
```

**`PassTypeView` response:**
```json
{
  "id": 1,
  "name": "Miesięczny",
  "price": 149.00,
  "durationDays": 30
}
```

#### Guests

| Method | Path | Description |
|---|---|---|
| GET | `/gyms/{gymId}/guests/{guestId}` | Guest detail |
| PUT | `/gyms/{gymId}/guests/{guestId}` | Update guest |

**`GuestDetailView` response:**
```json
{
  "guest": {
    "id": 1,
    "firstName": "Anna",
    "lastName": "Nowak",
    "email": "anna@example.com",
    "phone": "+48123456789",
    "notes": null,
    "hasActivePass": true,
    "isPresent": false,
    "hasLocker": false,
    "activePassEndDate": "2026-07-01",
    "avatarUrl": null
  },
  "passes": [ { "id": 1, "guestId": 1, "passType": "Miesięczny", "status": "ACTIVE", "startDate": "2026-06-01", "endDate": "2026-07-01", "price": 149.00 } ],
  "recentCheckIns": [ { "id": 1, "checkedInAt": "2026-06-20T08:00:00", "checkedOutAt": "2026-06-20T10:00:00" } ],
  "activeFreezes": [ { "id": 1, "passId": 1, "startDate": "2026-08-01", "endDate": "2026-08-14", "processed": false } ]
}
```

#### Passes (owner actions)

| Method | Path | Description |
|---|---|---|
| POST | `/gyms/{gymId}/passes/{passId}/renew` | Renew pass |
| POST | `/gyms/{gymId}/passes/{passId}/cancel` | Cancel pass |

**Renew request:**
```json
{
  "endDate": "2026-08-01",
  "price": 149.00
}
```

#### Lockers

| Method | Path | Description |
|---|---|---|
| POST | `/gyms/{gymId}/lockers` | Create locker |

**Request:**
```json
{
  "lockerNumber": "A01"
}
```

#### Calendar (schedule) — requires `SCHEDULE`

| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/gyms/{gymId}/calendar-events` | `from`, `to` (required) | List events |
| POST | `/gyms/{gymId}/calendar-events` | | Create event |
| PUT | `/gyms/{gymId}/calendar-events/{eventId}` | | Update event |
| DELETE | `/gyms/{gymId}/calendar-events/{eventId}` | | Delete event |

**`CalendarEventView`:**
```json
{
  "id": 1,
  "title": "Yoga",
  "description": "Morning session",
  "startAt": "2026-06-22T09:00:00",
  "endAt": "2026-06-22T10:00:00",
  "color": "#2155e5",
  "createdByUserId": 1,
  "createdByEmail": "owner@example.com",
  "canEdit": true
}
```

#### Work schedule — requires `WORK_SCHEDULE`

| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/gyms/{gymId}/work-schedule` | `from`, `to` (required), `employeeId` (optional) | List entries |
| POST | `/gyms/{gymId}/work-schedule` | | Create entry |
| PUT | `/gyms/{gymId}/work-schedule/{entryId}` | | Update entry |
| DELETE | `/gyms/{gymId}/work-schedule/{entryId}` | | Delete entry |

**`WorkScheduleEntryView`:**
```json
{
  "id": 1,
  "employeeId": 2,
  "employeeName": "Piotr Wiśniewski",
  "entryType": "SHIFT",
  "title": "Recepcja",
  "note": null,
  "startAt": "2026-06-22T08:00:00",
  "endAt": "2026-06-22T16:00:00",
  "color": "#2155e5",
  "canEdit": true
}
```

#### Products & sales — requires `INVENTORY` / `SALES_REPORT`

| Method | Path | Description |
|---|---|---|
| GET | `/gyms/{gymId}/products` | List products |
| POST | `/gyms/{gymId}/products` | Create product |
| PUT | `/gyms/{gymId}/products/{productId}` | Update product |
| DELETE | `/gyms/{gymId}/products/{productId}` | Delete product |
| GET | `/gyms/{gymId}/sales/products` | Product sale history |
| GET | `/gyms/{gymId}/sales-report` | Aggregated sales report |
| GET | `/gyms/{gymId}/sales-report/export.csv` | CSV export |

**`ProductView`:**
```json
{
  "id": 1,
  "name": "Protein Bar",
  "price": 12.50,
  "quantity": 50,
  "category": "Supplements",
  "barcode": "5901234123457"
}
```

**`GET /gyms/{gymId}/sales-report?from=2026-06-01&to=2026-06-30` response:**
```json
{
  "from": "2026-06-01",
  "to": "2026-06-30",
  "total": 15420.00,
  "productRevenue": 3200.00,
  "passCount": 42,
  "days": [ { "date": "2026-06-01", "total": 500.00, "count": 3 } ],
  "byPassType": [ { "passType": "Miesięczny", "total": 6200.00, "count": 42 } ]
}
```

#### Notifications — requires `NOTIFICATIONS`

| Method | Path | Description |
|---|---|---|
| GET | `/gyms/{gymId}/notifications` | List notifications |
| GET | `/gyms/{gymId}/notifications/unread-count` | Unread count |
| POST | `/gyms/{gymId}/notifications/{notificationId}/read` | Mark as read |
| GET | `/gyms/{gymId}/notification-settings` | Get settings |
| PUT | `/gyms/{gymId}/notification-settings` | Update settings |

**Unread count response:**
```json
{
  "count": 3
}
```

**Settings request/response:**
```json
{
  "expiringPassEmailEnabled": true,
  "expiringPassDaysBefore": 3,
  "notificationEmail": "owner@example.com"
}
```

#### Audit log — requires `AUDIT_LOG`

| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/gyms/{gymId}/audit-logs` | `from`, `to`, `action`, `actorEmail` (all optional) | Audit entries |

#### Trainers — requires `TRAINER_BOOKINGS`

| Method | Path | Description |
|---|---|---|
| GET | `/gyms/{gymId}/trainers` | List trainer profiles |
| POST | `/gyms/{gymId}/trainers` | Create trainer profile |
| PUT | `/gyms/{gymId}/trainers/{trainerId}` | Update trainer profile |
| DELETE | `/gyms/{gymId}/trainers/{trainerId}` | Delete trainer profile |

**`TrainerProfileView`:**
```json
{
  "id": 1,
  "employeeId": 3,
  "firstName": "Marek",
  "lastName": "Trener",
  "bio": "10 years experience",
  "specialization": "Strength",
  "hourlyRate": 120.00
}
```

#### Class ratings — requires `CLASS_RATINGS`

| Method | Path | Description |
|---|---|---|
| GET | `/gyms/{gymId}/classes/ratings-summary` | Per-class rating aggregates |
| GET | `/gyms/{gymId}/classes/{classId}/ratings` | Ratings for one class |

**`ClassRatingSummary`:**
```json
{
  "classId": 1,
  "className": "HIIT",
  "instructorName": "Marek Trener",
  "avgRating": 4.7,
  "ratingCount": 23
}
```

#### Analytics — requires `ANALYTICS`

| Method | Path | Description |
|---|---|---|
| GET | `/gyms/{gymId}/analytics` | Analytics dashboard |

**`AnalyticsDashboardDto` response:**
```json
{
  "metrics": {
    "activePasses": 120,
    "activeGuests": 95,
    "newGuestsThisMonth": 18,
    "checkInsToday": 42,
    "revenueThisMonth": 18500.00,
    "productRevenueThisMonth": 2400.00
  },
  "revenueOverTime": [ { "label": "2026-06-01", "value": 500.00 } ],
  "checkInsOverTime": [ { "label": "2026-06-01", "value": 35 } ],
  "passTypePopularity": [ { "passTypeName": "Miesięczny", "count": 80 } ]
}
```

---

### CRM — `/api/owner/gyms/{gymId}/crm` · Role: `OWNER` · requires `CRM`

| Method | Path | Description |
|---|---|---|
| GET | `/campaigns` | List email campaigns |
| POST | `/campaigns` | Create & send/schedule campaign |

**`POST /campaigns` request:**
```json
{
  "subject": "Summer promo",
  "body": "Hello {{imie}}, check out our **new offer**!",
  "targetSegment": "ALL_GUESTS",
  "scheduledAt": "2026-06-25T10:00:00",
  "imageUrl": "/uploads/images/promo.jpg"
}
```

`targetSegment`: `ALL_GUESTS` | `ACTIVE_PASSES` | `EXPIRED_PASSES` | `NO_PASS`  
`scheduledAt`: optional; if omitted or in the past, sends immediately.  
`imageUrl`: optional user-uploaded banner; campaign emails do **not** include system stock images.

**`EmailCampaignView` response:**
```json
{
  "id": 1,
  "subject": "Summer promo",
  "body": "Hello {{imie}}, check out our **new offer**!",
  "targetSegment": "ALL_GUESTS",
  "status": "SENT",
  "createdAt": "2026-06-21T12:00:00",
  "sentAt": "2026-06-21T12:00:01",
  "scheduledAt": null,
  "imageUrl": "/uploads/images/promo.jpg"
}
```

Body placeholders: `{{imie}}`, `{{nazwisko}}`, `{{email}}`, `{{telefon}}`. Bold: `**text**`. Inline images: `![alt](/uploads/images/file.jpg)`.

---

### Group classes — `/api/owner/gyms/{gymId}/classes` and `/api/employee/gyms/{gymId}/classes`

Access: `OWNER`, or `EMPLOYEE` with `MANAGE_CLASSES`.

| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/` | `from`, `to` (required) | List classes |
| POST | `/` | | Create class |
| PUT | `/{classId}` | | Update class |
| DELETE | `/{classId}` | | Delete class |
| GET | `/{classId}/reservations` | | List reservations |
| POST | `/{classId}/reservations/{reservationId}/attendance` | | Update attendance |
| GET | `/ratings` | | All class ratings |

**`GroupClassView`:**
```json
{
  "id": 1,
  "instructorId": 3,
  "instructorName": "Marek Trener",
  "name": "HIIT",
  "description": "High intensity",
  "startTime": "2026-06-22T18:00:00",
  "endTime": "2026-06-22T19:00:00",
  "capacity": 20,
  "activeReservations": 12,
  "userReservationStatus": null
}
```

**Create class request:**
```json
{
  "instructorId": 3,
  "name": "HIIT",
  "description": "High intensity",
  "startTime": "2026-06-22T18:00:00",
  "endTime": "2026-06-22T19:00:00",
  "capacity": 20
}
```

**`ClassReservationView`:**
```json
{
  "id": 1,
  "classId": 1,
  "guestId": 5,
  "guestFirstName": "Anna",
  "guestLastName": "Nowak",
  "guestEmail": "anna@example.com",
  "status": "RESERVED",
  "reservedAt": "2026-06-20T14:00:00"
}
```

**Attendance update request:**
```json
{
  "status": "ATTENDED"
}
```

---

### Employee — `/api/employee` · Role: `EMPLOYEE`

| Method | Path | Permission / notes | Description |
|---|---|---|---|
| GET | `/gyms` | | Gyms employee can access |
| GET | `/gyms/{gymId}/live` | | Live reception dashboard |
| GET | `/gyms/{gymId}/guests` | | List guests (`?q=` search) |
| POST | `/gyms/{gymId}/guests` | | Register guest |
| GET | `/gyms/{gymId}/guests/{guestId}` | | Guest detail |
| PUT | `/gyms/{gymId}/guests/{guestId}` | | Update guest |
| POST | `/gyms/{gymId}/guests/{guestId}/check-in` | | Check in |
| POST | `/gyms/{gymId}/guests/{guestId}/check-out` | | Check out |
| POST | `/gyms/{gymId}/scan-checkin` | | QR token check-in |
| POST | `/gyms/{gymId}/passes` | `SELL_PASSES` | Sell pass |
| POST | `/gyms/{gymId}/passes/{passId}/renew` | | Renew pass |
| POST | `/gyms/{gymId}/passes/{passId}/cancel` | | Cancel pass |
| POST | `/gyms/{gymId}/passes/{passId}/freeze` | | Freeze pass |
| POST | `/gyms/{gymId}/passes/{passId}/unfreeze` | | Unfreeze pass |
| GET | `/gyms/{gymId}/pass-types` | | List pass types |
| POST | `/gyms/{gymId}/pass-types` | `MANAGE_PASS_TYPES` | Create pass type |
| DELETE | `/gyms/{gymId}/pass-types/{passTypeId}` | `MANAGE_PASS_TYPES` | Delete pass type |
| POST | `/gyms/{gymId}/lockers` | `CREATE_LOCKERS` | Create locker |
| POST | `/gyms/{gymId}/lockers/assign` | `MANAGE_LOCKERS` | Assign locker |
| POST | `/gyms/{gymId}/guests/{guestId}/leave` | | Guest left gym |
| POST | `/gyms/{gymId}/guests/{guestId}/lockers/return` | | Return locker |
| GET/POST/PUT/DELETE | `/gyms/{gymId}/calendar-events` | `MANAGE_SCHEDULE` | Calendar CRUD |
| GET/POST/PUT/DELETE | `/gyms/{gymId}/work-schedule` | `MANAGE_WORK_SCHEDULE` | Work schedule CRUD |
| GET | `/gyms/{gymId}/products` | `SELL_PRODUCTS` | List products |
| POST | `/gyms/{gymId}/sales/checkout` | `SELL_PRODUCTS` | POS checkout |
| GET | `/gyms/{gymId}/products/by-barcode` | `SELL_PRODUCTS` | Lookup by `?code=` |
| GET | `/gyms/{gymId}/sales/my-history` | | Employee's sales history |
| GET | `/gyms/{gymId}/trainer-profile` | `PERSONAL_TRAINER` | Own trainer profile |
| PUT | `/gyms/{gymId}/trainer-profile` | `PERSONAL_TRAINER` | Update profile & availability |
| GET | `/gyms/{gymId}/trainer-profile/trainings` | `PERSONAL_TRAINER` | Booked trainings |
| DELETE | `/gyms/{gymId}/trainer-profile/trainings/{trainingId}` | `PERSONAL_TRAINER` | Cancel training |

**`EmployeeGymView`:**
```json
{
  "employeeId": 1,
  "gymId": 1,
  "gymName": "Just Gym",
  "gymAddress": "ul. Sportowa 1",
  "themeColor": "#2155e5",
  "subdomain": "justgym",
  "permissions": ["SELL_PASSES", "MANAGE_GUESTS"]
}
```

**`EmployeeLiveOverview`:**
```json
{
  "activeKeys": [ { "lockerId": 1, "lockerNumber": "A01", "guestId": 5, "guestName": "Anna Nowak", "assignedAt": "2026-06-21T08:00:00" } ],
  "presentGuests": [ { "guestId": 5, "firstName": "Anna", "lastName": "Nowak", "email": "anna@example.com" } ],
  "allLockers": [ { "id": 1, "lockerNumber": "A01", "status": "OCCUPIED", "guestId": 5 } ],
  "passTypes": [ { "id": 1, "name": "Miesięczny", "price": 149.00, "durationDays": 30 } ],
  "expiringPasses": [ { "guestId": 5, "firstName": "Anna", "lastName": "Nowak", "endDate": "2026-06-25", "daysRemaining": 4 } ],
  "salesLast7Days": 4200.00
}
```

**Sell pass request:**
```json
{
  "guestId": 5,
  "passType": "Miesięczny",
  "startDate": "2026-06-21",
  "endDate": "2026-07-21",
  "price": 149.00
}
```

**Assign locker request:**
```json
{
  "lockerId": 1,
  "guestId": 5
}
```

**QR scan check-in request:**
```json
{
  "token": "<qr-jwt-from-client>"
}
```

**Response:**
```json
{
  "status": "checked_in",
  "guestName": "Anna Nowak",
  "guestId": "5"
}
```

**POS checkout request:**
```json
{
  "guestId": 5,
  "items": [ { "productId": 1, "quantity": 2 } ],
  "paymentMethod": "CASH"
}
```

**`ProductSaleView` response:**
```json
{
  "id": 1,
  "soldByEmail": "staff@example.com",
  "guestName": "Anna Nowak",
  "totalAmount": 25.00,
  "paymentMethod": "CASH",
  "createdAt": "2026-06-21T10:30:00",
  "items": [ { "id": 1, "productId": 1, "productName": "Protein Bar", "quantity": 2, "unitPrice": 12.50 } ]
}
```

**Trainer profile update (`TrainerDtos`):**
```json
{
  "bio": "Certified PT",
  "specialization": "Strength",
  "hourlyRate": 120.00,
  "availabilities": [
    {
      "date": "2026-06-25",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "slotDurationMinutes": 60
    }
  ]
}
```

---

### Client portal — `/api/client` · Role: `GUEST`

| Method | Path | Description |
|---|---|---|
| GET | `/checkin-qr-token` | QR JWT for gym entry |
| GET | `/gyms` | Gyms client joined |
| GET | `/gyms/all` | All gyms (discovery) |
| POST | `/gyms/join` | Join a gym |
| GET | `/gyms/{gymId}/dashboard` | Client dashboard |
| GET | `/gyms/{gymId}/pass-types` | Available pass types |
| POST | `/gyms/{gymId}/purchase-pass` | Stripe checkout for pass |
| POST | `/gyms/{gymId}/simulate-payment` | Dev/test pass activation |
| GET | `/gyms/{gymId}/classes` | Classes (`?from=&to=`) |
| POST | `/gyms/{gymId}/classes/{classId}/book` | Book class |
| POST | `/gyms/{gymId}/classes/{classId}/cancel` | Cancel booking |
| POST | `/gyms/{gymId}/classes/{classId}/rate` | Rate class |
| POST | `/gyms/{gymId}/passes/{passId}/freeze` | Request pass freeze |
| GET | `/gyms/{gymId}/passes/{passId}/invoice` | PDF invoice |
| GET | `/dashboard/global-stats` | Cross-gym stats map |
| GET | `/gyms/{gymId}/trainers` | Trainer list |
| POST | `/gyms/{gymId}/trainers/{trainerId}/book` | Book PT session |
| GET | `/gyms/{gymId}/trainers/{trainerId}/available-slots` | Slots (`?date=`) |
| GET | `/gyms/{gymId}/trainers/{trainerId}/schedule` | Week schedule |
| GET | `/trainings` | Client's PT bookings |
| POST | `/gyms/{gymId}/trainings/{trainingId}/cancel` | Cancel PT booking |

**QR token response:**
```json
{
  "qrToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**`ClientGymView`:**
```json
{
  "id": 1,
  "name": "Just Gym",
  "address": "ul. Sportowa 1"
}
```

**Join gym request:**
```json
{
  "gymId": 1,
  "firstName": "Anna",
  "lastName": "Nowak",
  "phone": "+48123456789"
}
```

**Purchase pass request:**
```json
{
  "passTypeId": 1
}
```

**Purchase pass response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

**Rate class request:**
```json
{
  "rating": 5,
  "comment": "Great workout!"
}
```

**Book training request:**
```json
{
  "scheduledAt": "2026-06-25T10:00:00"
}
```

**`PersonalTrainingView`:**
```json
{
  "id": 1,
  "trainerId": 1,
  "trainerFirstName": "Marek",
  "trainerLastName": "Trener",
  "scheduledAt": "2026-06-25T10:00:00",
  "price": 120.00,
  "isPaid": true,
  "status": "CONFIRMED"
}
```

---

### Super admin — `/api/admin/saas` · Role: `SUPER_ADMIN` (except public plan reads)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/subscriptions` | SUPER_ADMIN | All gym subscriptions |
| GET | `/stats` | SUPER_ADMIN | Platform MRR stats |
| GET | `/plans` | Public | All plans |
| GET | `/plans/{id}` | Public | Single plan |
| POST | `/plans` | SUPER_ADMIN | Create plan |
| PUT | `/plans/{id}` | SUPER_ADMIN | Update plan |
| DELETE | `/plans/{id}` | SUPER_ADMIN | Delete plan |
| POST | `/subscriptions/{id}/cancel` | SUPER_ADMIN | Cancel subscription |
| POST | `/subscriptions/{id}/status` | SUPER_ADMIN | Set status |
| POST | `/subscriptions/{id}/plan` | SUPER_ADMIN | Change plan |
| GET | `/users` | SUPER_ADMIN | All users |
| DELETE | `/users/{id}` | SUPER_ADMIN | Delete user |
| POST | `/system/reset` | SUPER_ADMIN | Reset system (dangerous) |

**Create plan request:**
```json
{
  "name": "Starter",
  "price": 49.00,
  "features": "Essential tools for small gyms",
  "active": true,
  "featureFlags": ["SCHEDULE", "LOCKERS"]
}
```

**`GymSubscriptionDTO`:**
```json
{
  "id": 1,
  "gymId": 1,
  "gymName": "Just Gym",
  "gymAddress": "ul. Sportowa 1",
  "ownerEmail": "owner@example.com",
  "ownerFirstName": "Jan",
  "ownerLastName": "Kowalski",
  "saasPlanId": 2,
  "saasPlanName": "Pro",
  "status": "ACTIVE",
  "stripeSubscriptionId": "sub_xxx",
  "currentPeriodEnd": "2026-07-01T00:00:00",
  "createdAt": "2026-01-15T10:00:00"
}
```

**`SaaSAdminStatsDTO`:**
```json
{
  "totalMrr": 2490.00,
  "activeGyms": 18,
  "trialingGyms": 3,
  "canceledGyms": 2,
  "subscriptionsByPlan": [ { "planName": "Pro", "count": 12 } ],
  "subscriptionsByStatus": [ { "statusName": "ACTIVE", "count": 18 } ]
}
```

**`SaaSAdminUserDTO`:**
```json
{
  "id": 1,
  "email": "owner@example.com",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "role": "OWNER",
  "emailVerified": true
}
```

**Change subscription status request:**
```json
{
  "status": "ACTIVE"
}
```

**Change subscription plan request:**
```json
{
  "saasPlanId": 2
}
```

**System reset request:**
```json
{
  "confirmation": "RESET"
}
```

---

### Stripe webhook — `/api/stripe/webhook` · Public (signature verified)

| Method | Path | Description |
|---|---|---|
| POST | `/webhook` | Stripe event handler |

**Headers:** `Stripe-Signature: <signature>`  
**Body:** raw Stripe event JSON

**Response:** `"Success"` (200) or error string (400/500)

Handles `checkout.session.completed`, `customer.subscription.created|updated|deleted` for pass purchases and SaaS subscriptions.

---

## WebSocket

Endpoint: `/ws-gym` (STOMP over SockJS)

Used for live updates on the employee reception dashboard (check-ins, locker changes). Connect with JWT in STOMP headers; subscribe to gym-specific topics configured in `WebSocketConfig`.

Vite dev proxy: `/ws-gym` → `http://localhost:8080`.

---

## File Uploads

| Endpoint | Purpose |
|---|---|
| `POST /api/upload/image` | Generic images (CRM campaigns, etc.) |

Uploaded files: `uploads/images/<uuid>.<ext>`  
Public URL: `/uploads/images/<uuid>.<ext>`

Avatar URLs on guests/employees are set via `avatarUrl` fields on create/update DTOs (URL pointing to an uploaded file).

---

## Scheduled Jobs

| Cron | Default | Job |
|---|---|---|
| `EXPIRE_PASSES_CRON` | `0 0 1 * * *` (01:00 daily) | Mark expired passes |
| `EXPIRING_NOTIFICATIONS_CRON` | `0 0 8 * * *` (08:00 daily) | Notify about expiring passes |
| CRM scheduler | every minute | Send scheduled email campaigns |

CRM campaign processor: `CrmService.processScheduledCampaigns()` — runs every minute.

---

## Frontend Structure

```
frontend/src/
├── api.ts              # REST client & TypeScript types
├── appRouter.tsx       # Top-level routes
├── AppShell.tsx        # Sidebar layout (owner/employee/super admin)
├── routes/             # Route guards & per-role route objects
├── pages/
│   ├── owner/          # Owner portal pages
│   ├── employee/       # Employee portal pages
│   ├── superadmin/     # Super admin pages
│   └── ...             # Auth, client, landing pages
├── components/         # Shared UI (forms, calendar, pickers)
├── hooks/              # useGymSubdomainGuard, usePostAuthRedirect
├── planFeaturesContext.tsx  # SaaS plan feature gating (nav)
└── saasPlanFeatures.ts # Feature flag definitions
```

### Main routes

| Path prefix | Role |
|---|---|
| `/owner/*` | Gym owner |
| `/employee/*` | Employee |
| `/client/*` | Guest / client |
| `/superadmin/*` | Super admin |
| `/login`, `/register` | Public auth |
| `/register-gym` | Tenant onboarding |

---

## Testing

```bash
# Backend
mvn test

# Frontend
cd frontend && npm test
```

---

## Server Maintenance

On a small VPS (e.g. 29 GB disk), frequent `docker compose up -d --build` accumulates **build cache** (often 10–20 GB).

```bash
# Check Docker disk usage
docker system df -v

# Safe cleanup (does not remove running containers or postgres volume)
docker builder prune -a -f
docker system prune -f

# NEVER run without checking first:
# docker volume prune   ← can delete postgres_data
```

Consider increasing EBS volume size if deploys are frequent.

---

## License

Proprietary — see repository owner for terms.
