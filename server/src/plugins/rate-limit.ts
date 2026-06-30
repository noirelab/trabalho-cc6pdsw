import { FastifyRequest, FastifyReply } from "fastify";
import { RateLimitError } from "../lib/errors";

const attempts = new Map<string, { count: number; firstAttempt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function loginRateLimit(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const ip = request.ip;
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return;
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    throw new RateLimitError();
  }

  entry.count++;
}

export function clearRateLimit(ip: string) {
  attempts.delete(ip);
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (now - entry.firstAttempt > WINDOW_MS) {
      attempts.delete(ip);
    }
  }
}, 5 * 60 * 1000);
