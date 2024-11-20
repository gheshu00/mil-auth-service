import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

redis.on('connect', () => {
  console.log('Connected to Redis successfully.');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;
