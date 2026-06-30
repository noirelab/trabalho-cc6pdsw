import prisma from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { CreateUserInput, UpdateUserInput } from "./users.schema";
import { NotFoundError, ValidationError } from "../../lib/errors";

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, username: true, name: true, createdAt: true },
  });
}

export async function createUser(data: CreateUserInput) {
  const existing = await prisma.user.findUnique({
    where: { username: data.username },
  });

  if (existing) {
    throw new ValidationError("Usuário já existe");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: { ...data, password: hashedPassword },
    select: { id: true, username: true, name: true, createdAt: true },
  });
}

export async function updateUser(id: number, data: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("Usuário não encontrado");

  const updateData: any = { ...data };

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, username: true, name: true, createdAt: true },
  });
}

export async function deleteUser(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("Usuário não encontrado");

  await prisma.user.delete({ where: { id } });
}
