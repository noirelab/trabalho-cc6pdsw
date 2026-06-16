import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "unobtainium-super-secret";

export interface JwtPayload {
  userId: number;
  username: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.cookies["auth-token"];

  if (!token) {
    return reply.status(401).send({ error: "Não autenticado" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    request.user = payload;
  } catch {
    return reply.status(401).send({ error: "Token inválido ou expirado" });
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}
