import redisConnection from "../config/cache.js";

const INGEST_QUEUE_NAME = "item-ingest";

let queueInstance = null;

async function createQueue() {
  if (queueInstance) return queueInstance;

  const { Queue } = await import("bullmq");

  queueInstance = new Queue(INGEST_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: 100,
      removeOnFail: 100,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  });

  return queueInstance;
}

export async function enqueueItemIngest(itemId) {
  try {
    const queue = await createQueue();

    const job = await queue.add(
      "process-item",
      { itemId: String(itemId) },
      {
        jobId: `item-${itemId}`,
      }
    );

    return { queued: true, jobId: job.id };
  } catch (error) {
    console.warn("[Queue] Failed to enqueue ingest job:", error.message);
    return { queued: false, error: error.message };
  }
}

export { INGEST_QUEUE_NAME };
