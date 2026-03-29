import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import redisConnection from "../config/cache.js";
import "../models/collection.model.js";
import "../models/item.model.js";
import "../models/user.model.js";
import { processIngestJob } from "../services/ingest.service.js";
import { INGEST_QUEUE_NAME } from "../queues/ingest.queue.js";

let workerInstance = null;

export async function startIngestWorker() {
  if (workerInstance) return workerInstance;

  const { Worker } = await import("bullmq");

  await connectDB();

  workerInstance = new Worker(
    INGEST_QUEUE_NAME,
    async (job) => {
      return processIngestJob(job.data.itemId);
    },
    {
      connection: redisConnection,
      concurrency: Number(process.env.INGEST_WORKER_CONCURRENCY || 2),
    }
  );

  workerInstance.on("completed", (job) => {
    console.log(`[Worker] Ingest completed for job ${job.id}`);
  });

  workerInstance.on("failed", (job, error) => {
    console.error(`[Worker] Ingest failed for job ${job?.id}:`, error.message);
  });

  console.log("[Worker] Ingest worker is running");
  return workerInstance;
}

const isDirectRun =
  process.argv[1] &&
  process.argv[1].endsWith("src\\workers\\ingest.worker.js");

if (isDirectRun) {
  startIngestWorker().catch((error) => {
    console.error("[Worker] Failed to start ingest worker:", error.message);
    process.exit(1);
  });
}
