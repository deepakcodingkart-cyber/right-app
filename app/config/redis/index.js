import { createClient } from "redis";

let client;

export async function getRedisClient() {
  if (!client) {
    // 💡 Connect to your local Docker container
    client = createClient({
      socket: {
        host: "localhost", // Use 'localhost' to connect to the Docker port mapping
        port: 6379,       // Use the port you mapped (6379)
      },
    });

    client.on("error", (err) => console.error("Redis Client Error", err));
    await client.connect(); // Connect to the local Redis
  }
  return client;
}

export const connection ={
      host: "localhost",
      port: 6379,
}
