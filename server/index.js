import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import issueRoutes from './issueRoutes.js';
import accountRoutes from './accountRoutes.js';
import seedDatabase from './seed.js';
import pool, { initializeDatabase } from './db.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builtClient = path.join(rootDir, 'client', 'dist');

app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
}));
app.use(express.json({ limit: '8mb' }));
app.use('/api', accountRoutes);
app.use('/api', issueRoutes);

app.use('/api', (_req, res) => res.status(404).json({ message: 'API endpoint not found.' }));

async function start() {
  if (!process.env.SQL_PASSWORD) throw new Error('SQL_PASSWORD is required. Copy .env.example to .env and configure MariaDB/MySQL.');
  await initializeDatabase();
  await seedDatabase();

  app.use(express.static(builtClient));
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(builtClient, 'index.html'), (error) => { if (error) next(error); });
  });
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Request body must contain valid JSON.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large.' });
    console.error(error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  });
  const server = app.listen(port, () => console.log(`INSAT API and site are running on port ${port}.`));
  server.on('error', (error) => {
    console.error(`Could not listen on port ${port}: ${error.message}`);
    process.exitCode = 1;
  });
  const shutdown = (signal) => {
    console.log(`${signal} received; closing the INSAT server.`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch(async (error) => {
  console.error(`Startup failed: ${error.message}`);
  await pool.end();
  process.exitCode = 1;
});
