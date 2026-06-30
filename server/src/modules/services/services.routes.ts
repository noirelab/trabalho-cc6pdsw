import { FastifyInstance } from "fastify";
import { createServiceSchema, updateServiceSchema } from "./services.schema";
import * as servicesService from "./services.service";
import { authMiddleware, requireAdmin } from "../../plugins/auth";

export async function servicesRoutes(app: FastifyInstance) {
  app.get("/api/services", async (_request, reply) => {
    const services = await servicesService.listServices();
    return reply.send({ services });
  });

  app.get("/api/services/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const service = await servicesService.getServiceById(Number(id));
      return reply.send({ service });
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  app.post(
    "/api/services",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const parsed = createServiceSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const service = await servicesService.createService(parsed.data);
      return reply.status(201).send({ service });
    }
  );

  app.put(
    "/api/services/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateServiceSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      try {
        const service = await servicesService.updateService(
          Number(id),
          parsed.data
        );
        return reply.send({ service });
      } catch (err: any) {
        return reply.status(404).send({ error: err.message });
      }
    }
  );

  app.delete(
    "/api/services/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        await servicesService.deleteService(Number(id));
        return reply.status(204).send();
      } catch (err: any) {
        return reply.status(404).send({ error: err.message });
      }
    }
  );
}
