import { createClient } from "redis";

let client;

export async function getRedisClient() {
  if (!client) {
    client = createClient({
      username: "default",
      password: "WkVmMF1efqc5b4Xt0Hvuw5zhPtzVq7s4",
      socket: {
        host: "redis-15800.c90.us-east-1-3.ec2.redns.redis-cloud.com",
        port: 15800,
      },
    });

    client.on("error", (err) => console.error("Redis Client Error", err));
    await client.connect();
  }

  return client;
}


