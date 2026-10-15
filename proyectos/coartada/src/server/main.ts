// Entry point. Configuration comes only from environment variables (no secrets needed).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { SCENARIOS } from '../shared/content/scenarios';
import { createGameServer } from './app';

const here = dirname(fileURLToPath(import.meta.url));
// Bundled: dist/server.mjs next to dist/client. Dev (tsx): no client dir, Vite serves it.
const clientDir = process.env.CLIENT_DIR ?? join(here, 'client');

const log = (msg: string, data?: Record<string, unknown>) =>
  console.log(JSON.stringify({ t: new Date().toISOString(), msg, ...data }));

const server = await createGameServer({
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  scenarios: SCENARIOS,
  clientDir: existsSync(clientDir) ? clientDir : undefined,
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  trustProxy: process.env.TRUST_PROXY === '1',
  maxRooms: process.env.MAX_ROOMS ? Number(process.env.MAX_ROOMS) : undefined,
  log,
});

const shutdown = async () => {
  log('shutting down');
  await server.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', (err) => log('unhandledRejection', { error: String(err) }));
