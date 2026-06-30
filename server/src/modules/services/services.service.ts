import prisma from "../../lib/prisma";
import { CreateServiceInput, UpdateServiceInput } from "./services.schema";
import { NotFoundError } from "../../lib/errors";
import { parsePagination, buildSearchFilter, PaginatedResult } from "../../lib/pagination";

export async function listServices() {
  return prisma.service.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function listServicesPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>> {
  const { page, limit, sort, order, search } = parsePagination(query, "services");
  const where = buildSearchFilter(search, ["title", "description"]);

  const [data, total] = await Promise.all([
    prisma.service.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
    prisma.service.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getServiceById(id: number) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new NotFoundError("Serviço não encontrado");
  return service;
}

export async function createService(data: CreateServiceInput) {
  return prisma.service.create({ data });
}

export async function updateService(id: number, data: UpdateServiceInput) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new NotFoundError("Serviço não encontrado");

  return prisma.service.update({ where: { id }, data });
}

export async function deleteService(id: number) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new NotFoundError("Serviço não encontrado");

  await prisma.service.delete({ where: { id } });
}
