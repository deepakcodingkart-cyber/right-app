// import { createClient } from "redis";

// let client;

// export async function getRedisClient() {
//   if (!client) {
//     client = createClient({
//       username: "default",
//       password: "WkVmMF1efqc5b4Xt0Hvuw5zhPtzVq7s4",
//       socket: {
//         host: "redis-15800.c90.us-east-1-3.ec2.redns.redis-cloud.com",
//         port: 15800,
//       },
//     });

//     client.on("error", (err) => console.error("Redis Client Error", err));
//     await client.connect();
//   }

//   return client;
// }



// Corrected connection in dbservices/redis.js
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
      // You don't need username/password unless you configured the container to use one.
      // If you are using a client that defaults to `redis://localhost:6379` you can simplify even more:
      // client = createClient();
    });

    client.on("error", (err) => console.error("Redis Client Error", err));
    await client.connect(); // Connect to the local Redis
  }

  return client;
}
