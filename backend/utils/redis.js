import Redis from "ioredis";

const redis = new Redis(); // default localhost:6379

export default redis;



// import Redis from "ioredis";

// const redis = new Redis({
//   host: process.env.REDIS_HOST || "localhost", // Docker में container name
//   port: process.env.REDIS_PORT || 6379,
//   retryStrategy: times => Math.min(times * 50, 2000), // optional retry
// });

// redis.on("connect", () => console.log("✅ Redis connected"));
// redis.on("error", err => console.error("Redis connection error:", err.message));

// export default redis;




// const redis = new Redis({
//   host: "3.109.204.28",
//   port: 6379,
//   password: "mypassword123",
// });

// export default redis;