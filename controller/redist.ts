import redis from "@/lib/reddis";
import { Request, Response } from "express";

/**
 * GET /redis-data
 * Fetch all keys and values from Redis
 */
export const getAllRedisData = async (req: Request, res: Response) => {
  try {
    // Add a "helloworld" key with a value to Redis
    const key = "count";
    let value = await redis.get(key);

    let count = parseInt(value || "0", 10);
    count += 1;
    await redis.set(key, count.toString());

    if (value === "enough attempts") {
      // If the count has already reached the limit, return the current value
      return res.status(200).json({
        message: "Limit reached",
        value,
      });
    }

    const allData: Record<string, string | null> = {};
    let cursor = "0";

    do {
      // Use SCAN to fetch a batch of keys
      const [nextCursor, keys] = await redis.scan(cursor);

      if (keys.length > 0) {
        // Fetch values for the keys
        const values = await redis.mget(...keys);
        keys.forEach((key, index) => {
          allData[key] = values[index];
        });
      }

      cursor = nextCursor; // Update cursor
    } while (cursor !== "0"); // Repeat until cursor loops back to "0"

    res.status(200).json({
      message: "Item added and Redis data fetched successfully",
      data: allData,
    });
  } catch (error: any) {
    console.error("Error during Redis operations:", error);
    res.status(500).json({
      message: "Failed to add item or fetch Redis data",
      error: error.message,
    });
  }
};
