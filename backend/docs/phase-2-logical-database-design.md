 # Phase 2 — Logical Database Design

**AquaFlow — Smart Water Management System**  
**Stack:** PostgreSQL · Prisma ORM · Node.js · Express · ES Modules  
**Scope:** Core models only — `Role`, `User`, `WaterMeter`, `WaterReading`, `Notification`  
**Out of scope:** Controllers, routes, authentication logic, frontend, Billing/Payments/etc. tables

---

## 1. Overview

Phase 2 converts the Phase 1 conceptual entities into a **normalized, production-ready PostgreSQL schema** expressed in Prisma. The design prioritizes:

- Referential integrity and clear cascade rules  
- Time-series performance for meter readings  
- Extensibility for future modules without breaking core tables  
- Security-minded column naming and constraints  

**Source of truth for domain meaning:** existing `backend/prisma/schema.prisma` (Phase 1 stub) and project READMEs listing the five core models. No separate ERD document existed in-repo; this Phase 2 design is the logical refinement of that conceptual set.

---

## 2. Entity-Relationship Summary

```
Role 1 ──< User 1 ──< WaterMeter 1 ──< WaterReading
              │
              └──< Notification
```

| Relationship | Cardinality | Required? | Delete behavior |
|---|---|---|---|
| Role → User | 1 : N | Yes (`roleId` NOT NULL) | `Restrict` |
| User → WaterMeter | 1 : N | Yes (`userId` NOT NULL) | `Restrict` |
| WaterMeter → WaterReading | 1 : N | Yes (`meterId` NOT NULL) | `Cascade` |
| User → Notification | 1 : N | Yes (`userId` NOT NULL) | `Cascade` |

---

## 3. Model Specifications

### 3.1 Role

| Property | Detail |
|---|---|
| **Table** | `roles` |
| **Primary key** | `id` — `UUID`, `@default(uuid())` |
| **Columns** | See table below |
| **Unique** | `name` |
| **Indexes** | Unique index on `name` (via `@unique`) |
| **FKs** | None (parent lookup) |
| **Relationships** | `users User[]` |

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `Uuid` | NO | `uuid()` | Surrogate PK |
| `name` | `VarChar(64)` | NO | — | e.g. `ADMIN`, `OPERATOR`, `CUSTOMER`, `TECHNICIAN` |
| `description` | `VarChar(255)` | YES | — | Admin UI / documentation |
| `createdAt` | `Timestamptz(3)` | NO | `now()` | Audit |
| `updatedAt` | `Timestamptz(3)` | NO | `@updatedAt` | Audit |

**Why a table, not a Prisma enum?**  
Smart water systems evolve roles (e.g. `BILLING_CLERK`, `FIELD_TECH`). A `Role` table allows new roles via seed/admin data **without a schema migration**. Prisma enums require migrations for every new value. Phase 2 keeps **one role per user** (matches conceptual 1:N). A future `UserRole` join table can introduce M:N RBAC without rewriting User PKs (see §10).

---

### 3.2 User

| Property | Detail |
|---|---|
| **Table** | `users` |
| **Primary key** | `id` — `UUID` |
| **Unique** | `email` |
| **Indexes** | `email` (unique), `roleId`, `status` |
| **FKs** | `roleId` → `roles.id` |
| **Relationships** | `role`, `meters[]`, `notifications[]` |

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `Uuid` | NO | `uuid()` | Public-safe identifier |
| `fullName` | `VarChar(150)` | NO | — | Display name |
| `email` | `VarChar(255)` | NO | — | Login identity; unique |
| `phone` | `VarChar(30)` | YES | — | Optional contact |
| `passwordHash` | `VarChar(255)` | NO | — | Stores hash only (bcrypt/argon2); never plaintext |
| `status` | `UserStatus` | NO | `ACTIVE` | Lifecycle without soft-delete column |
| `roleId` | `Uuid` | NO | — | Required role assignment |
| `createdAt` | `Timestamptz(3)` | NO | `now()` | |
| `updatedAt` | `Timestamptz(3)` | NO | `@updatedAt` | |

**ON DELETE:** `Restrict` — cannot delete a role that still has users.

---

### 3.3 WaterMeter

| Property | Detail |
|---|---|
| **Table** | `water_meters` |
| **Primary key** | `id` — `UUID` |
| **Unique** | `meterNumber` |
| **Indexes** | `meterNumber` (unique), `userId`, `status` |
| **FKs** | `userId` → `users.id` |
| **Relationships** | `user`, `readings[]` |

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `Uuid` | NO | `uuid()` | |
| `meterNumber` | `VarChar(64)` | NO | — | Physical/asset identifier; unique |
| `location` | `VarChar(255)` | NO | — | Human-readable site address/label |
| `status` | `MeterStatus` | NO | `ACTIVE` | Operational lifecycle |
| `installedAt` | `Timestamptz(3)` | YES | — | Optional install date |
| `userId` | `Uuid` | NO | — | Assigned account (customer/owner) |
| `createdAt` | `Timestamptz(3)` | NO | `now()` | |
| `updatedAt` | `Timestamptz(3)` | NO | `@updatedAt` | |

**ON DELETE:** `Restrict` on User — meters must be reassigned or decommissioned before user removal. Preserves operational integrity.

**Location modeling:** Kept as a single string for Phase 2 (matches conceptual design). Future `Location` / `Premise` entity can replace this without changing reading history (add nullable `locationId`, backfill, then deprecate `location`).

---

### 3.4 WaterReading

| Property | Detail |
|---|---|
| **Table** | `water_readings` |
| **Primary key** | `id` — `UUID` |
| **Unique** | `(meterId, recordedAt)` |
| **Indexes** | Composite `(meterId, recordedAt)`, `recordedAt` |
| **FKs** | `meterId` → `water_meters.id` |
| **Relationships** | `meter` |

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `Uuid` | NO | `uuid()` | |
| `meterId` | `Uuid` | NO | — | Parent meter |
| `value` | `Decimal(14,4)` | NO | — | Volume in m³ (app defines cumulative vs delta) |
| `recordedAt` | `Timestamptz(3)` | NO | — | Observation timestamp (not insert time) |
| `createdAt` | `Timestamptz(3)` | NO | `now()` | Ingest timestamp |
| `updatedAt` | `Timestamptz(3)` | NO | `@updatedAt` | Rarely updated; kept for consistency |

**ON DELETE:** `Cascade` — readings are dependent facts of a meter; removing a meter removes its series. Meter deletion itself is rare and should be an explicit admin action after archival if required.

**Why both `@@unique([meterId, recordedAt])` and `@@index([meterId, recordedAt])`?**  
The unique constraint creates a supporting unique index in PostgreSQL, which also serves the primary query pattern (readings for a meter ordered by time). The explicit `@@index` documents intent; Prisma/PostgreSQL will use the unique index for the same access path. The separate `recordedAt` index supports cross-meter time-range analytics.

---

### 3.5 Notification

| Property | Detail |
|---|---|
| **Table** | `notifications` |
| **Primary key** | `id` — `UUID` |
| **Unique** | None beyond PK |
| **Indexes** | `(userId, status)`, `(userId, createdAt)` |
| **FKs** | `userId` → `users.id` |
| **Relationships** | `user` |

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `Uuid` | NO | `uuid()` | |
| `userId` | `Uuid` | NO | — | Recipient |
| `type` | `NotificationType` | NO | `SYSTEM` | Routing / UI iconography |
| `title` | `VarChar(200)` | NO | — | Short headline |
| `message` | `Text` | NO | — | Body |
| `status` | `NotificationStatus` | NO | `UNREAD` | Inbox state |
| `readAt` | `Timestamptz(3)` | YES | — | Set when marked read |
| `createdAt` | `Timestamptz(3)` | NO | `now()` | |
| `updatedAt` | `Timestamptz(3)` | NO | `@updatedAt` | |

**ON DELETE:** `Cascade` — notifications are user-owned ephemeral data; no value if the user account is removed.

---

## 4. Enums

| Enum | Values | Rationale |
|---|---|---|
| `UserStatus` | `ACTIVE`, `INACTIVE`, `SUSPENDED` | Account lifecycle without soft-delete |
| `MeterStatus` | `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `DECOMMISSIONED` | Asset lifecycle; decommission ≈ soft retire |
| `NotificationType` | `SYSTEM`, `ALERT`, `BILLING`, `MAINTENANCE`, `LEAK` | Closed set; new types need deliberate migration (good for API contracts) |
| `NotificationStatus` | `UNREAD`, `READ`, `ARCHIVED` | Inbox workflow |

**Role is intentionally not an enum** — see §3.1.

---

## 5. Design Decision Rationale

### 5.1 UUID primary keys (`@default(uuid()) @db.Uuid`)

| Option | Pros | Cons |
|---|---|---|
| `SERIAL` / `Int` | Compact, sequential, fast joins | Predictable IDs; merge pain across environments |
| `cuid` / `ulid` (string) | Sortable (ulid), opaque | Not native UUID type; larger indexes |
| **UUID v4 (chosen)** | Opaque public IDs, safe client exposure, multi-env merges, native `uuid` type in PG | Slightly larger than int; random insert locality |

**Choice:** UUID with PostgreSQL `@db.Uuid`. Fits distributed/public API IDs and Prisma + PG common practice. Native UUID is preferable to storing UUIDs as `TEXT`.

### 5.2 Timestamps (`createdAt` / `updatedAt` / `Timestamptz`)

- Every mutable entity gets `createdAt` + `updatedAt` for audit and support.  
- `@db.Timestamptz(3)` stores UTC instants correctly across regions (water utilities often span time zones / DST).  
- Readings separate **observation time** (`recordedAt`) from **ingest time** (`createdAt`) — critical for IoT late arrivals.

### 5.3 Unique email

Login and identity key. Unique constraint prevents duplicate accounts and enables efficient lookup. Application layer should normalize case (e.g. lowercase) before insert; DB enforces uniqueness on stored value.

### 5.4 Unique meter number

Asset identity from the field/hardware. Must be globally unique within AquaFlow to avoid billing and reading collisions.

### 5.5 `passwordHash` (not `password`)

Phase 1 used `password`. Renamed to `passwordHash` so the schema documents that only a hash is stored. No auth code in this phase — column exists for schema completeness.

### 5.6 `Decimal` for reading values (not `Float`)

IEEE floats cause rounding errors in billing-adjacent volumes. `Decimal(14,4)` supports large cumulative totals with 0.0001 m³ precision.

### 5.7 Field renames from Phase 1 conceptual stub

| Phase 1 | Phase 2 | Why |
|---|---|---|
| `password` | `passwordHash` | Security clarity |
| `amountUsed` (`Float`) | `value` (`Decimal`) | Precision + neutral naming (cumulative vs delta is app convention) |
| `readingDate` | `recordedAt` | Time-series convention; includes time-of-day |
| `status` as `String` | Prisma enums | Integrity + typed client |
| — | `User.status`, `Notification.type/title/readAt`, `Role.description`, `Meter.installedAt` | Production completeness |

### 5.8 Soft deletes

**Not used** as a global `deletedAt` pattern. Lifecycle is modeled via:

- `UserStatus` (`INACTIVE` / `SUSPENDED`)  
- `MeterStatus` (`DECOMMISSIONED`)  

This avoids filtering soft-deleted rows on every query while still supporting “retire without destroy.” Hard deletes remain possible under cascade/restrict rules.

### 5.9 Single role per user

Matches conceptual design and reduces join complexity for Phase 2. Extension to M:N is documented in §10 without requiring PK changes.

### 5.10 `@@map` for table names

Tables use snake_case (`users`, `water_meters`, …) for SQL/reporting friendliness. Prisma client keeps PascalCase/camelCase. Column-level `@map` omitted — Prisma field names map 1:1 to columns; acceptable when Prisma is the primary access layer. If raw SQL reporting proliferates later, add column `@map` in a dedicated rename migration.

### 5.11 Indexes

| Index | Purpose |
|---|---|
| `users.email` unique | Auth lookup |
| `users.roleId` | Join / filter by role |
| `users.status` | Admin lists of active/suspended |
| `water_meters.meterNumber` unique | Asset lookup |
| `water_meters.userId` | “Meters for customer” |
| `water_meters.status` | Fleet filters |
| `water_readings (meterId, recordedAt)` | Primary time-series query |
| `water_readings.recordedAt` | Global time-range / analytics |
| `notifications (userId, status)` | Unread inbox |
| `notifications (userId, createdAt)` | Chronological feed |

### 5.12 Generator / datasource (Prisma 7)

- `provider = "prisma-client"` with custom `output` matches the existing Prisma 7 setup and `backend/src/config/database.js`.  
- `DATABASE_URL` lives in `prisma.config.ts` (Prisma 7), not in `schema.prisma` — do not re-add `url` to the schema file.

---

## 6. Normalization Analysis

### 6.1 First Normal Form (1NF)

- Atomic columns only (no arrays/CSV of readings or roles in a cell).  
- No repeating groups.  
- Each row uniquely identified by PK.  

**Verdict: Satisfies 1NF.**

### 6.2 Second Normal Form (2NF)

- All tables use single-column surrogate PKs (UUID).  
- Non-key attributes depend on the whole key (no composite PK with partial dependencies).  
- Reading attributes (`value`, `recordedAt`) depend only on `WaterReading.id` (and logically on the meter observation), not on a partial key.

**Verdict: Satisfies 2NF.**

### 6.3 Third Normal Form (3NF)

- No transitive dependencies of non-key → non-key within a table.  
- Role name/description live in `Role`, not duplicated on `User`.  
- Meter location/status live on `WaterMeter`, not copied onto each `WaterReading`.  
- Notification content is not duplicated onto `User`.

**Verdict: Satisfies 3NF.**

### 6.4 Deliberate denormalization

None in Phase 2. Future analytics may introduce materialized views or summary tables (e.g. monthly consumption) **outside** the OLTP core — those are derived, not violations of the logical model.

---

## 7. Constraint & Cascade Strategy

| Parent | Child | `onDelete` | `onUpdate` | Justification |
|---|---|---|---|---|
| Role | User | **Restrict** | Cascade | Roles are reference data; block delete while assigned |
| User | WaterMeter | **Restrict** | Cascade | Protect meters/readings; reassign first |
| WaterMeter | WaterReading | **Cascade** | Cascade | Readings are dependent time-series of the meter |
| User | Notification | **Cascade** | Cascade | Ephemeral, user-owned messages |

**Application-level rules (enforced in services later):**

1. Never delete a `User` with active meters — reassign or decommission meters first (`Restrict` backs this).  
2. Prefer `MeterStatus.DECOMMISSIONED` over hard-deleting meters with long reading history; if hard-delete is required, cascade removes readings (archive first if compliance demands retention).  
3. Prefer `UserStatus.INACTIVE` / `SUSPENDED` over hard-delete for audit continuity.

**Required relationships:** All FKs above are `NOT NULL` — no orphan meters, readings, or notifications.

---

## 8. Complete Prisma Schema

Canonical file: `backend/prisma/schema.prisma`

```prisma
// AquaFlow — Phase 2 Logical Database Design
// PostgreSQL + Prisma ORM (production-ready core models)

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum MeterStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
  DECOMMISSIONED
}

enum NotificationType {
  SYSTEM
  ALERT
  BILLING
  MAINTENANCE
  LEAK
}

enum NotificationStatus {
  UNREAD
  READ
  ARCHIVED
}

model Role {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique @db.VarChar(64)
  description String?  @db.VarChar(255)
  createdAt   DateTime @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime @updatedAt @db.Timestamptz(3)

  users User[]

  @@map("roles")
}

model User {
  id           String     @id @default(uuid()) @db.Uuid
  fullName     String     @db.VarChar(150)
  email        String     @unique @db.VarChar(255)
  phone        String?    @db.VarChar(30)
  passwordHash String     @db.VarChar(255)
  status       UserStatus @default(ACTIVE)
  roleId       String     @db.Uuid
  createdAt    DateTime   @default(now()) @db.Timestamptz(3)
  updatedAt    DateTime   @updatedAt @db.Timestamptz(3)

  role          Role           @relation(fields: [roleId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  meters        WaterMeter[]
  notifications Notification[]

  @@index([roleId])
  @@index([status])
  @@map("users")
}

model WaterMeter {
  id          String      @id @default(uuid()) @db.Uuid
  meterNumber String      @unique @db.VarChar(64)
  location    String      @db.VarChar(255)
  status      MeterStatus @default(ACTIVE)
  installedAt DateTime?   @db.Timestamptz(3)
  userId      String      @db.Uuid
  createdAt   DateTime    @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime    @updatedAt @db.Timestamptz(3)

  user     User           @relation(fields: [userId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  readings WaterReading[]

  @@index([userId])
  @@index([status])
  @@map("water_meters")
}

model WaterReading {
  id         String   @id @default(uuid()) @db.Uuid
  meterId    String   @db.Uuid
  value      Decimal  @db.Decimal(14, 4)
  recordedAt DateTime @db.Timestamptz(3)
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  updatedAt  DateTime @updatedAt @db.Timestamptz(3)

  meter WaterMeter @relation(fields: [meterId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@unique([meterId, recordedAt])
  @@index([meterId, recordedAt])
  @@index([recordedAt])
  @@map("water_readings")
}

model Notification {
  id        String             @id @default(uuid()) @db.Uuid
  userId    String             @db.Uuid
  type      NotificationType   @default(SYSTEM)
  title     String             @db.VarChar(200)
  message   String             @db.Text
  status    NotificationStatus @default(UNREAD)
  readAt    DateTime?          @db.Timestamptz(3)
  createdAt DateTime           @default(now()) @db.Timestamptz(3)
  updatedAt DateTime           @updatedAt @db.Timestamptz(3)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@index([userId, status])
  @@index([userId, createdAt])
  @@map("notifications")
}
```

---

## 9. Migration Workflow

Prisma migrations are the source of truth for schema evolution. With this repo’s scripts:

```bash
cd backend
# Ensure DATABASE_URL is set in .env (see prisma.config.ts)

# Develop: create + apply migration from schema diff
npm run prisma:migrate
# → prisma migrate dev
#    prompts for a name, e.g. phase2_logical_core

# Generate client into src/generated/prisma
npm run prisma:generate

# Production / CI: apply existing migrations only
npx prisma migrate deploy

# Inspect data
npm run prisma:studio
```

### How it works

1. Edit `prisma/schema.prisma`.  
2. `prisma migrate dev` diffs schema vs last migration, writes SQL under `prisma/migrations/<timestamp>_<name>/`, applies it, regenerates the client.  
3. Commit **both** the schema and the migration folder.  
4. Other environments run `prisma migrate deploy` (no interactive prompts; applies pending SQL in order).  

### Phase 2 first migration notes

- No prior migrations exist in-repo; the first `migrate dev` will create all five tables + enums.  
- If a database already contains Phase 1 stub tables with different column names (`password`, `amountUsed`, etc.), either:  
  - **Greenfield:** reset/drop and migrate fresh (dev only), or  
  - **Brownfield:** hand-craft a migration that renames columns (`password` → `passwordHash`, etc.) to avoid data loss.  

### Seed (recommended next step, not in this phase’s code)

After migrate, seed roles (`ADMIN`, `OPERATOR`, `CUSTOMER`, `TECHNICIAN`) via `prisma/seed.ts` so `User.roleId` FKs have targets.

---

## 10. Future Module Extension (Without Breaking Cores)

**Principle:** Add new tables that **reference** core PKs via nullable or required FKs. Avoid renaming/removing core columns; prefer additive migrations. Use `onDelete: Restrict` from billing/audit modules into cores so financial history cannot be casually destroyed.

| Future module | Extension approach | Touch cores? |
|---|---|---|
| **Billing** | `Invoice` / `InvoiceLine` with `userId`, optional `meterId`, period dates, amounts | Add relations only on `User` / `WaterMeter` |
| **Payments** | `Payment` → `Invoice`; do not store card PANs — token/provider refs | No core column changes |
| **Maintenance** | `WorkOrder` with `meterId`, `assignedToUserId`, status enum | Additive FKs |
| **Leak Detection** | `LeakEvent` with `meterId`, `detectedAt`, severity; may link `notificationId` | Additive; `NotificationType.LEAK` already reserved |
| **IoT Sensors** | `Sensor` 1:1 or 1:N with `WaterMeter`; `SensorReading` or map into `WaterReading` with `source` enum later | Prefer new tables; optional later `source` on readings via additive enum value |
| **Reports / Analytics** | Materialized views / warehouse tables keyed by `meterId` + period; do not denormalize into OLTP readings | Zero breaking changes |

### Safe evolution patterns

1. **Additive columns:** nullable first → backfill → set NOT NULL if required.  
2. **New enums values:** Prisma requires a migration; plan API compatibility.  
3. **M:N roles later:** introduce `UserRole(userId, roleId)` → backfill from `User.roleId` → eventually drop `roleId` in a major version (or keep as “primary role”).  
4. **Locations:** add `locations` + nullable `WaterMeter.locationId` → migrate strings → drop `location` later.  
5. **Partitioning:** when readings volume grows, partition `water_readings` by `recordedAt` range (PostgreSQL) — same logical model, physical optimization.  
6. **Never** embed billing totals on `User` or duplicate meter numbers across modules.

### What we intentionally did **not** stub

No empty Billing/Payment tables. Cores remain deployable alone; extension points are UUID FKs and reserved notification types (`BILLING`, `LEAK`, `MAINTENANCE`).

---

## 11. Senior Backend Architect Review

### Scalability

- Readings are the write-hot path; composite indexing on `(meterId, recordedAt)` and uniqueness for idempotent IoT ingest are correct Phase 2 foundations.  
- UUID PKs avoid cross-region ID coordination issues if services split later.  
- Expect to partition or archive `water_readings` before other tables; schema does not block that.  
- Notifications indexes support inbox queries; consider TTL/archival jobs later for large tenants.

### Maintainability

- Clear 1NF–3NF boundaries; role names not duplicated.  
- Enums for closed sets; Role table for open RBAC vocabulary.  
- Consistent audit timestamps and `@@map` table names.  
- Documented cascade matrix reduces accidental data loss in application code.

### Security

- `passwordHash` naming and `VarChar(255)` sized for modern hashes.  
- Opaque UUIDs reduce enumeration vs sequential ints.  
- Unique email supports account integrity.  
- Restrict rules on Role/User/Meter protect operational assets from careless deletes.  
- Application must still enforce authorization (row-level: customers see only their meters) — schema enables it via `userId` FKs but does not replace authZ.

### Performance

- FK and status indexes cover primary filters.  
- `Decimal` is slightly heavier than float but correct for water volumes.  
- Avoid N+1 in app layer with Prisma `include`/`select`; schema indexes support the SQL underneath.  
- Global `recordedAt` index helps analytics; drop later if unused and write amplification matters.

### Future-proofing

- Extension strategy is additive-first.  
- Reserved notification types align with planned modules.  
- Single-role users can grow to M:N without rewriting reading/meter history.  
- Location string is the main conceptual simplification to revisit when multi-unit premises appear.

### Residual risks / follow-ups

1. Define application convention: is `WaterReading.value` **cumulative** or **interval**? Document in domain glossary before billing.  
2. Add a seed migration/script for system roles.  
3. Consider DB-level check constraints later (e.g. `value >= 0`) via raw SQL in migrations — Prisma does not express all CHECKs natively.  
4. Email uniqueness is case-sensitive at the DB unless the app lowercases; add a citext extension or normalized `emailNormalized` column if required.  
5. High-volume IoT may eventually want batch ingest and conflict handling on `(meterId, recordedAt)` unique violations (`ON CONFLICT`).

**Overall verdict:** The Phase 2 schema is production-appropriate for AquaFlow’s core domain: normalized, constrained, indexed for the hot path, and extensible without premature module tables.

---

## Document control

| Item | Value |
|---|---|
| Phase | 2 — Logical Database Design |
| Schema path | `backend/prisma/schema.prisma` |
| This document | `backend/docs/phase-2-logical-database-design.md` |
| Migrations | None applied yet — run `npm run prisma:migrate` when ready |
