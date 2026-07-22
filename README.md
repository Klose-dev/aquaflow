# AquaFlow

Smart Water Management System Full Stack Application

## Project Structure

```
AquaFlow/
├── frontend/          # React + Vite application
└── backend/           # Node.js + Express API
```

## Phase 1 — Foundation (Current)

### Backend
- Express server with clean architecture
- Prisma ORM with PostgreSQL
- Database models: User, Role, WaterMeter, WaterReading, Notification
- Central error handling and async middleware
- Folder structure: config, controllers, middleware, models, routes, services, utils

### Frontend
- React 19 + Vite
- React Router for navigation
- Axios API service with environment variables
- Folder structure: components, pages, layouts, services, hooks, context

## Getting Started

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, Prisma |
| Database | PostgreSQL |
