import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Client as WorkflowClient } from "@upstash/workflow";
import { Client as QstashClient } from "@upstash/qstash";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "chat_ratelimit",
});

export const workflowClient = new WorkflowClient({
  baseUrl: process.env.QSTASH_URL!,
  token: process.env.QSTASH_TOKEN!,
});

export const qstashClient = new QstashClient({
  token: process.env.QSTASH_TOKEN!,
});