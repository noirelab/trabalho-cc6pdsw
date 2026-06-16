import prisma from "../../lib/prisma";
import { CreateServiceInput, UpdateServiceInput } from "./services.schema";

export async function listServices() {
  return prisma.service.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function getServiceById(id: number) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new Error("Serviço não encontrado");
  return service;
}

export async function createService(data: CreateServiceInput) {
  return prisma.service.create({ data });
}

export async function updateService(id: number, data: UpdateServiceInput) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new Error("Serviço não encontrado");

  return prisma.service.update({ where: { id }, data });
}

export async function deleteService(id: number) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new Error("Serviço não encontrado");

  await prisma.service.delete({ where: { id } });
}
