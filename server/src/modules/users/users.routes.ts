import { FastifyInstance } from "fastify";
import { createUserSchema, updateUserSchema } from "./users.schema";
import * as usersService from "./users.service";
import { authMiddleware } from "../../plugins/auth";

export async function usersRoutes(app: FastifyInstance) {
  app.get(
    "/api/users",
    { preHandler: authMiddleware },
    async (_request, reply) => {
      const users = await usersService.listUsers();
      return reply.send({ users });
    }
  );

  app.post(
    "/api/users",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const parsed = createUserSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      try {
        const user = await usersService.createUser(parsed.data);
        return reply.status(201).send({ user });
      } catch (err: any) {
        return reply.status(409).send({ error: err.message });
      }
    }
  );

  app.put(
    "/api/users/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateUserSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      try {
        const user = await usersService.updateUser(Number(id), parsed.data);
        return reply.send({ user });
      } catch (err: any) {
        return reply.status(404).send({ error: err.message });
      }
    }
  );

  app.delete(
    "/api/users/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        await usersService.deleteUser(Number(id));
        return reply.status(204).send();
      } catch (err: any) {
        return reply.status(404).send({ error: err.message });
      }
    }
  );
}
