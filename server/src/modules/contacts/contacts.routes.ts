import { FastifyInstance } from "fastify";
import { createContactSchema, updateContactSchema } from "./contacts.schema";
import * as contactsService from "./contacts.service";
import { authMiddleware, requireAdmin } from "../../plugins/auth";

export async function contactsRoutes(app: FastifyInstance) {
  app.post("/api/contacts", async (request, reply) => {
    const parsed = createContactSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const contact = await contactsService.createContact(parsed.data);
    return reply.status(201).send({ contact });
  });

  app.get(
    "/api/contacts",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const result = await contactsService.listContactsPaginated(request.query as Record<string, unknown>);
      return reply.send(result);
    }
  );

  app.put(
    "/api/contacts/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateContactSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const contact = await contactsService.updateContact(
        Number(id),
        parsed.data
      );
      return reply.send({ contact });
    }
  );

  app.delete(
    "/api/contacts/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await contactsService.deleteContact(Number(id));
      return reply.status(204).send();
    }
  );
}
