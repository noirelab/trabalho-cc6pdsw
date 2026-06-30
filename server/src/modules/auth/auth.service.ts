import prisma from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, JwtPayload } from "../../plugins/auth";
import { UnauthorizedError, NotFoundError } from "../../lib/errors";

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    throw new UnauthorizedError("Credenciais inválidas");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new UnauthorizedError("Credenciais inválidas");
  }

  const payload: JwtPayload = { userId: user.id, username: user.username, role: user.role };
  const token = signToken(payload);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
    },
  };
}

export async function getUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true, createdAt: true },
  });

  if (!user) {
    throw new NotFoundError("Usuário não encontrado");
  }

  return user;
}
