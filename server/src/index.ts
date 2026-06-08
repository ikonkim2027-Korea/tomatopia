/**
 * Tomatopia backend (Fastify + Prisma + SQLite).
 *
 * Privacy by design: we never store a child's real name, email, or password.
 * A "garden" is keyed by an opaque id and tagged with a self-chosen nickname
 * and an optional class code so a teacher can see a class's gardens.
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

const MAX_STATE_BYTES = 64 * 1024; // generous cap for a save blob

function cleanNickname(n: unknown): string {
  if (typeof n !== 'string') return 'Gardener';
  return n.trim().slice(0, 20) || 'Gardener';
}

function serializeState(state: unknown): string | null {
  try {
    const s = JSON.stringify(state ?? {});
    return s.length <= MAX_STATE_BYTES ? s : null;
  } catch {
    return null;
  }
}

app.get('/health', async () => ({ ok: true }));

// Create a garden
app.post('/gardens', async (req, reply) => {
  const body = req.body as { nickname?: string; classCode?: string; state?: unknown };
  const state = serializeState(body.state);
  if (state === null) return reply.code(400).send({ error: 'invalid or too-large state' });
  const garden = await prisma.garden.create({
    data: {
      nickname: cleanNickname(body.nickname),
      classCode: body.classCode ? String(body.classCode).trim().slice(0, 16) : null,
      state,
    },
  });
  return { id: garden.id };
});

// Read a garden
app.get('/gardens/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const garden = await prisma.garden.findUnique({ where: { id } });
  if (!garden) return reply.code(404).send({ error: 'not found' });
  return {
    id: garden.id,
    nickname: garden.nickname,
    state: JSON.parse(garden.state),
    updatedAt: garden.updatedAt,
  };
});

// Update a garden
app.put('/gardens/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as { nickname?: string; classCode?: string; state?: unknown };
  const state = serializeState(body.state);
  if (state === null) return reply.code(400).send({ error: 'invalid or too-large state' });
  try {
    const garden = await prisma.garden.update({
      where: { id },
      data: {
        nickname: cleanNickname(body.nickname),
        classCode: body.classCode ? String(body.classCode).trim().slice(0, 16) : undefined,
        state,
      },
    });
    return { id: garden.id };
  } catch {
    return reply.code(404).send({ error: 'not found' });
  }
});

// Teacher view: read-only summaries for a class code (no full state dump)
app.get('/classes/:code/gardens', async (req) => {
  const { code } = req.params as { code: string };
  const gardens = await prisma.garden.findMany({
    where: { classCode: code },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, nickname: true, updatedAt: true },
  });
  return { code, count: gardens.length, gardens };
});

const port = Number(process.env.PORT ?? 8787);
app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`Tomatopia API on :${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
