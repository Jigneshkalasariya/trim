import dotenv from 'dotenv';

dotenv.config();

import cors from 'cors';
import express from 'express';
import { connectDB } from './db.js';
import healthRouter from './routes/health.js';
import redirectRouter from './routes/redirect.js';
import urlRouter from './routes/url.js';

const PORT = Number(process.env.PORT ?? 4000);

async function main(): Promise<void> {
  await connectDB();

  const app = express();

  app.set('trust proxy', true);

  app.use(
    cors({
      origin: [
        process.env.CLIENT_URL ?? 'http://localhost:5173',
        'http://localhost:4173',
        'https://trimlongurl.vercel.app',
      ],
    }),
  );
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/urls', urlRouter);
  app.use(redirectRouter);

  app.listen(PORT, () => {});
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
