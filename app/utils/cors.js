import { cors } from "remix-utils/cors";

export const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  headers: ["Content-Type", "Authorization", "X-Requested-With"],
};

export async function withCors(request, response) {
  return cors(request, response, corsOptions);
}
