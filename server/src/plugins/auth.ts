import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "../lib/errors";

const JWT_SECRET = process.env.JWT_SECRET || "unobtainium-super-secret";

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const token = request.cookies["auth-token"];

  if (!token) {
    throw new UnauthorizedError("Não autenticado");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    request.user = payload;
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado");
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  if (!request.user || request.user.role !== "admin") {
    throw new ForbiddenError("Acesso restrito a administradores");
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}
