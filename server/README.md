# Tomatopia backend

Fastify + Prisma + SQLite. Stores garden saves with **no child personal data** — only a
self-chosen nickname, an optional class code, and the game-state JSON.

## Run locally

```bash
cp .env.example .env
npm install
npm run db:push     # create the SQLite schema (dev.db)
npm start           # http://localhost:8787
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | liveness check |
| POST | `/gardens` | create a garden `{ nickname, classCode?, state }` → `{ id }` |
| GET  | `/gardens/:id` | read a garden |
| PUT  | `/gardens/:id` | update a garden |
| GET  | `/classes/:code/gardens` | teacher view: read-only summaries for a class |

## Deploy to Render

A [`render.yaml`](../render.yaml) at the repo root defines the service. On Render: New →
Blueprint → point at this repo. It uses a persistent disk for the SQLite file. For larger
deployments switch `datasource db` in `prisma/schema.prisma` to `postgresql` and set
`DATABASE_URL` accordingly.

After deploy, set the frontend's `VITE_API_URL` to the service URL and redeploy the
frontend.
