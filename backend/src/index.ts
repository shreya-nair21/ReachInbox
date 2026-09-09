import express from 'express';
import cors from 'cors';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { ENV } from './config/env';
import { prisma } from './config/prisma';
import { redisClient } from './config/redis';
import { queueService } from './services/queue.service';
import { workerService } from './services/worker.service';
import { elasticsearchService } from './services/elasticsearch.service';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler.middleware';

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Bull Board UI for Queue Visibility (/admin/queues)
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(queueService.queue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// REST APIs
app.use('/api', apiRoutes);

// Error Handler
app.use(errorHandler);

// Server Startup
const startServer = async () => {
  try {
    // 1. Verify Database Connection
    await prisma.$connect();
    console.log('✅ Connected to MySQL Database via Prisma');

    // 2. Initialize Elasticsearch (with resilient fallback)
    await elasticsearchService.initialize();

    // 3. Reconcile pending jobs on startup to guarantee persistence across restarts
    await queueService.reconcilePendingJobs();

    // 4. Start HTTP Server
    const server = app.listen(ENV.PORT, () => {
      console.log(`
=============================================================
🚀 ReachInbox Email Scheduler Backend is running!
🌐 API URL:              http://localhost:${ENV.PORT}/api
📊 Bull Board Dashboard: http://localhost:${ENV.PORT}/admin/queues
⚙️ Worker Concurrency:   ${ENV.WORKER_CONCURRENCY}
⏱️ Min Delay per email:  ${ENV.MIN_DELAY_BETWEEN_EMAILS}ms
🛑 Hourly Limit/Sender:  ${ENV.MAX_EMAILS_PER_HOUR_PER_SENDER}
=============================================================
      `);
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close();
      await workerService.close();
      await queueService.queue.close();
      await redisClient.quit();
      await prisma.$disconnect();
      console.log('✅ Graceful shutdown completed.');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err: any) {
    console.error('💥 Fatal error starting server:', err);
    process.exit(1);
  }
};

startServer();
