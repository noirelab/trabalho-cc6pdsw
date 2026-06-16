import { FastifyInstance } from "fastify";
import { createContactSchema } from "./contacts.schema";
import * as contactsService from "./contacts.service";
import { authMiddleware } from "../../plugins/auth";

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
    { preHandler: authMiddleware },
    async (_request, reply) => {
      const contacts = await contactsService.listContacts();
      return reply.send({ contacts });
    }
  );

  app.delete(
    "/api/contacts/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        await contactsService.deleteContact(Number(id));
        return reply.status(204).send();
      } catch (err: any) {
        return reply.status(404).send({ error: err.message });
      }
    }
  );
}
