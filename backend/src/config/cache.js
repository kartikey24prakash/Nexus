import dotenv from "dotenv";

dotenv.config();

export const redisConnection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

if (process.env.REDIS_URL) {
  redisConnection.url = process.env.REDIS_URL;
}

if (process.env.REDIS_TLS === "true") {
  redisConnection.tls = {};
}

export default redisConnection;
