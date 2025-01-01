import Redis from "ioredis";

let redis: Redis | null = null;

// Create a reusable Redis connection
const getRedisClient = (): Redis => {
  if (redis) {
    return redis;
  }

  // Create a new connection if it's not initialized
  redis = new Redis(process.env.REDIS_URI!);

  redis.on("connect", () => {
    console.log("Connected to Redis successfully.");
  });

  redis.on("error", (err) => {
    console.error("Redis connection error:", err);
  });

  return redis;
};

export default getRedisClient;