import prisma from "../../lib/prisma";
import { CreateProjectInput, UpdateProjectInput } from "./projects.schema";

export async function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createProject(data: CreateProjectInput) {
  return prisma.project.create({ data });
}

export async function updateProject(id: number, data: UpdateProjectInput) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new Error("Projeto não encontrado");
  return prisma.project.update({ where: { id }, data });
}

export async function deleteProject(id: number) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new Error("Projeto não encontrado");
  await prisma.project.delete({ where: { id } });
}
