# AquaFlow Backend

Node.js + Express API for the AquaFlow Smart Water Management System.

## Stack

- Node.js
- Express
- Prisma ORM 7
- PostgreSQL

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/
│   │   └── database.js        # Prisma client singleton (@prisma/adapter-pg)
│   ├── controllers/
│   ├── generated/prisma/      # Generated client (gitignored)
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── docs/
│   ├── phase-2-logical-database-design.md
│   └── phase-4-database-implementation.md
├── prisma.config.ts           # Prisma 7 datasource URL from DATABASE_URL
├── .env                       # Local secrets (gitignored)
├── .env.example
├── package.json
└── README.md
```

## Getting Started

```bash
cd backend
npm install
cp .env.example .env   # Windows: copy .env.example .env
# Edit DATABASE_URL, then:
npm run prisma:migrate
npm run prisma:generate
npm run dev
```

The API will be available at `http://localhost:5000/api`.

## Phase 4 — Database (PostgreSQL + Prisma)

Phase 4 turns the Phase 2 logical schema into a live database with migrations and a generated Prisma Client.

**Full guide:** [docs/phase-4-database-implementation.md](./docs/phase-4-database-implementation.md)

Quick checks:

```bash
npm run prisma:validate    # schema syntax
npm run prisma:migrate     # apply migrations (dev)
npm run prisma:generate    # refresh src/generated/prisma
npm run prisma:studio      # browse tables
```

Initial migration: `20260721004539_init`. Requires a reachable PostgreSQL instance (see `.env.example` and the Phase 4 doc for Docker on port 5433).

## Environment Variables

See `.env.example`. Minimum:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
PORT=5000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon |
| `npm run start` | Start production server |
| `npm run prisma:validate` | Validate `schema.prisma` |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations (dev) |
| `npm run prisma:studio` | Open Prisma Studio |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api | Health check |
