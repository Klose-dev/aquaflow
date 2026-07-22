# Phase 4 — Database Implementation

**AquaFlow Smart Water Management System**  
**Stack:** PostgreSQL · Prisma ORM 7 · Node.js · Express · ES Modules  
**Prerequisite:** [Phase 2  Logical Database Design](./phase-2-logical-database-design.md)  
**Scope:** Live database, migrations, Prisma Client generation, verification **no** controllers, routes, auth, or seed data.

---

## 1. What Phase 4 Delivers

Phase 2 defined *what* the database should look like in `schema.prisma`. Phase 4 makes that design **real**:

1. A running PostgreSQL instance (local or Docker).
2. Version-controlled SQL migrations under `prisma/migrations/`.
3. A generated, type-safe Prisma Client at `src/generated/prisma/`.
4. Documented environment configuration (`.env`, `.env.example`).
5. Verification that tables, enums, indexes, and foreign keys match the Phase 2 design.

Later phases (services, API routes) will import the singleton Prisma client from `src/config/database.js` — they do **not** talk to PostgreSQL directly.

---

## 2. Files Created or Modified (and Why)

| Path | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Verified (Phase 2) | Single source of truth for models |
| `prisma.config.ts` | Verified | Prisma 7: schema path, migrations folder, `DATABASE_URL` |
| `prisma/migrations/20260721004539_init/migration.sql` | **Created** | Initial DDL |
| `prisma/migrations/migration_lock.toml` | **Created** | Provider lock (`postgresql`) |
| `.env` | **Updated** | Local `DATABASE_URL` (gitignored) |
| `.env.example` | **Created** | Placeholder template |
| `package.json` | **Updated** | Added `prisma:validate` |
| `src/generated/prisma/` | **Regenerated** | Prisma Client output |
| `src/config/database.js` | Verified | Adapter-pg singleton |
| `src/controllers/.gitkeep`, `src/services/.gitkeep` | **Created** | Preserve empty dirs |
| `docs/phase-4-database-implementation.md` | **Created** | This document |
| `README.md` | **Updated** | Phase 4 quick start |

**Out of scope:** seed scripts, auth, controllers, routes.


---

## 3. Prisma Setup Verification

### 3.1 Packages

- `prisma` (^7.8.0) — CLI
- `@prisma/client` (^7.8.0) — runtime
- `@prisma/adapter-pg` + `pg` — PostgreSQL driver (Prisma 7)

Run `npm install` in `backend/`.

### 3.2 NPM scripts

| Script | Command |
|--------|---------|
| `npm run prisma:validate` | `prisma validate` |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:generate` | `prisma generate` |
| `npm run prisma:studio` | `prisma studio` |

### 3.3 `prisma.config.ts` (Prisma 7)

The datasource **URL** is loaded from `DATABASE_URL` via `env("DATABASE_URL")`. The schema file declares `provider = "postgresql"` only.

### 3.4 Generator

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

Generated output is gitignored; run `prisma generate` after schema changes.

---

## 4. `DATABASE_URL` Explained

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

| Part | Meaning |
|------|---------|
| `postgresql://` | Wire protocol for PostgreSQL |
| `USER` / `PASSWORD` | Database role credentials (URL-encode special chars in passwords) |
| `HOST` | e.g. `localhost`, cloud host |
| `PORT` | Usually `5432`; Docker may map another host port (e.g. `5433`) |
| `DATABASE` | Database name, e.g. `aquaflow` |
| `?schema=public` | PostgreSQL schema Prisma uses |

Copy `.env.example` to `.env` and replace placeholders.

### Local Docker (Phase 4 verification)

```bash
docker run -d --name aquaflow-postgres \
  -e POSTGRES_USER=aquaflow \
  -e POSTGRES_PASSWORD=aquaflow_dev \
  -e POSTGRES_DB=aquaflow \
  -p 5433:5432 \
  postgres:16-alpine
```

```
DATABASE_URL="postgresql://aquaflow:aquaflow_dev@localhost:5433/aquaflow?schema=public"
```


---

## 5. Schema (Phase 2 Reference)

See [phase-2-logical-database-design.md](./phase-2-logical-database-design.md).

```
Role 1 ──< User 1 ──< WaterMeter 1 ──< WaterReading
              └──< Notification
```

### Models

| Model | Table | Purpose |
|-------|-------|---------|
| Role | roles | RBAC lookup |
| User | users | Accounts |
| WaterMeter | water_meters | Customer meters |
| WaterReading | water_readings | Time-series usage |
| Notification | notifications | Alerts/messages |

### Enums

- `UserStatus` — ACTIVE, INACTIVE, SUSPENDED
- `MeterStatus` — ACTIVE, INACTIVE, MAINTENANCE, DECOMMISSIONED
- `NotificationType` — SYSTEM, ALERT, BILLING, MAINTENANCE, LEAK
- `NotificationStatus` — UNREAD, READ, ARCHIVED

### Role table vs enum

**Role is a table** so new role names (OPERATOR, TECHNICIAN, BILLING_CLERK) can be added with **data** (INSERT), not a schema migration. Enums fit **closed** sets that rarely change (user/meter/notification status). Phase 2 explicitly rejected a `UserRole` enum for RBAC names.

### Delete behavior

| Child | Parent | onDelete |
|-------|--------|----------|
| User | Role | Restrict |
| WaterMeter | User | Restrict |
| WaterReading | WaterMeter | Cascade |
| Notification | User | Cascade |

Unique: `users.email`, `roles.name`, `water_meters.meterNumber`, `(meterId, recordedAt)` on readings.


---

## 6. Migrations

A **migration** is versioned SQL plus history in `_prisma_migrations`.

**Phase 4 migration:** `20260721004539_init`  
**Command:** `npx prisma migrate dev --name init`  
**Status:** Applied successfully.

Files:

- `prisma/migrations/<timestamp>_<name>/migration.sql` — review in PRs
- `prisma/migrations/migration_lock.toml` — locks provider to PostgreSQL

**Dev workflow:** edit schema → `prisma validate` → `prisma migrate dev` → `prisma generate`.  
**Production:** `prisma migrate deploy` (apply only; never create migrations on prod).

Do not edit applied migration SQL on shared branches; add a new migration instead.

---

## 7. Prisma Client

```bash
npm run prisma:generate
```

Output: `Generated Prisma Client (7.8.0) to .\src\generated\prisma`

Services (future) import `src/config/database.js`:

```javascript
import prisma from "../config/database.js";
// e.g. prisma.waterReading.findMany({ where: { meterId } })
```

Controllers should stay thin; domain logic uses typed Prisma APIs in services.

---

## 8. Verification (Phase 4)

| Check | Result |
|-------|--------|
| `npm run prisma:validate` | Schema valid |
| `npx prisma migrate dev --name init` | Migration applied |
| `npx prisma migrate status` | Up to date |
| `npm run prisma:generate` | Client generated |
| `psql \dt` (Docker) | roles, users, water_meters, water_readings, notifications, _prisma_migrations |

Optional: `npm run prisma:studio`.

---

## 9. Common Mistakes

1. Missing or wrong `DATABASE_URL`
2. Port/credential mismatch (5432 vs Docker 5433)
3. Skipping `prisma generate` after schema changes
4. Committing `.env` (use `.env.example`)
5. Changing applied migration files instead of adding a new migration
6. Turning `Role` into an enum without a design review

---

## 10. Architecture Fit

```
Frontend → Express (routes → services) → Prisma (database.js) → PostgreSQL
```

Phase 4 delivers PostgreSQL schema + migrations + client. Later phases add water-domain services on these tables.

---

## 11. New Developer Checklist

1. `cd backend && npm install`
2. Copy `.env.example` → `.env`
3. Start PostgreSQL (Docker or local)
4. `npm run prisma:migrate`
5. `npm run prisma:generate`
6. `npm run prisma:validate`

---

## 12. Blockers During Phase 4

Placeholder credentials on `localhost:5432` caused **P1010 access denied** while port 5432 was in use by another instance. Fix: Docker container `aquaflow-postgres` on port **5433** and matching `DATABASE_URL`. Start Docker Desktop and the container before migrating on a fresh machine.

*End of Phase 4 documentation.*
