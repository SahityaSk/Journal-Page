import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import issueRoutes from './issueRoutes.js';
import seedDatabase from './seed.js';

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
app.use(express.json({ limit: '1mb' }));
app.use('/api', issueRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Request body must contain valid JSON.' });
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. Copy .env.example to .env and configure MongoDB.');
  await mongoose.connect(process.env.MONGODB_URI);
  await seedDatabase();

  app.use(express.static(builtClient));
  app.get('*', (_req, res) => res.sendFile(path.join(builtClient, 'index.html')));
  app.listen(port, () => console.log(`INSAT API and site are running on port ${port}.`));
}

start().catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exitCode = 1;
});
