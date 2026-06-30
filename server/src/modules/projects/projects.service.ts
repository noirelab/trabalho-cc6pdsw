import prisma from "../../lib/prisma";
import { CreateProjectInput, UpdateProjectInput } from "./projects.schema";
import { NotFoundError } from "../../lib/errors";
import { parsePagination, buildSearchFilter, PaginatedResult } from "../../lib/pagination";

export async function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function listProjectsPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>> {
  const { page, limit, sort, order, search } = parsePagination(query, "projects");
  const where = buildSearchFilter(search, ["title", "description"]);

  const [data, total] = await Promise.all([
    prisma.project.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
    prisma.project.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createProject(data: CreateProjectInput) {
  return prisma.project.create({ data });
}

export async function updateProject(id: number, data: UpdateProjectInput) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new NotFoundError("Projeto não encontrado");
  return prisma.project.update({ where: { id }, data });
}

export async function deleteProject(id: number) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new NotFoundError("Projeto não encontrado");
  await prisma.project.delete({ where: { id } });
}
