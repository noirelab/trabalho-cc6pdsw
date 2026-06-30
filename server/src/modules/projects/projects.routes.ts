import { FastifyInstance } from "fastify";
import { createProjectSchema, updateProjectSchema } from "./projects.schema";
import * as projectsService from "./projects.service";
import { authMiddleware, requireAdmin } from "../../plugins/auth";

export async function projectsRoutes(app: FastifyInstance) {
  app.get("/api/projects", async (_request, reply) => {
    const projects = await projectsService.listProjects();
    return reply.send({ projects });
  });

  app.post(
    "/api/projects",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const parsed = createProjectSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const project = await projectsService.createProject(parsed.data);
      return reply.status(201).send({ project });
    }
  );

  app.put(
    "/api/projects/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateProjectSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      try {
        const project = await projectsService.updateProject(
          Number(id),
          parsed.data
        );
        return reply.send({ project });
      } catch (err: any) {
        return reply.status(404).send({ error: err.message });
      }
    }
  );

  app.delete(
    "/api/projects/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        await projectsService.deleteProject(Number(id));
        return reply.status(204).send();
      } catch (err: any) {
        return reply.status(404).send({ error: err.message });
      }
    }
  );
}
