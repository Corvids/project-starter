import Redis from "ioredis";
import { requireServerEnv } from "@/lib/env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function redis(): Redis {
  if (!globalForRedis.redis) {
    const client = new Redis(requireServerEnv("REDIS_URL"), {
      connectTimeout: 3_000,
      maxRetriesPerRequest: 1,
    });
    client.on("error", (error: Error) => {
      console.error(`[redis] ${error.message}`);
    });
    globalForRedis.redis = client;
  }
  return globalForRedis.redis;
}
