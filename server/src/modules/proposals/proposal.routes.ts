import { FastifyInstance } from "fastify";
import { authMiddleware, requireAdmin } from "../../plugins/auth";
import {
  createProposalSchema,
  updateProposalSchema,
  statusTransitionSchema,
  addItemSchema,
  updateItemSchema,
} from "./proposal.schema";
import * as proposalService from "./proposal.service";

export async function proposalsRoutes(app: FastifyInstance) {
  app.get(
    "/api/proposals",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const result = await proposalService.listProposalsPaginated(
        request.query as Record<string, unknown>
      );
      return reply.send(result);
    }
  );

  app.get(
    "/api/proposals/reports",
    { preHandler: [authMiddleware, requireAdmin] },
    async (_request, reply) => {
      const reports = await proposalService.getReports();
      return reply.send(reports);
    }
  );

  app.get(
    "/api/proposals/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const proposal = await proposalService.getProposalById(Number(id));
      return reply.send({ proposal });
    }
  );

  app.post(
    "/api/proposals",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const parsed = createProposalSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const proposal = await proposalService.createProposal(
        parsed.data,
        request.user!.userId
      );
      return reply.status(201).send({ proposal });
    }
  );

  app.put(
    "/api/proposals/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateProposalSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const proposal = await proposalService.updateProposal(Number(id), parsed.data);
      return reply.send({ proposal });
    }
  );

  app.patch(
    "/api/proposals/:id/status",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = statusTransitionSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const proposal = await proposalService.transitionStatus(
        Number(id),
        parsed.data,
        request.user!.userId
      );
      return reply.send({ proposal });
    }
  );

  app.delete(
    "/api/proposals/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await proposalService.deleteProposal(Number(id));
      return reply.status(204).send();
    }
  );

  app.post(
    "/api/proposals/:id/items",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = addItemSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const proposal = await proposalService.addItem(
        Number(id),
        parsed.data,
        request.user!.userId
      );
      return reply.status(201).send({ proposal });
    }
  );

  app.put(
    "/api/proposals/:id/items/:itemId",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id, itemId } = request.params as { id: string; itemId: string };
      const parsed = updateItemSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const proposal = await proposalService.updateItem(
        Number(id),
        Number(itemId),
        parsed.data,
        request.user!.userId
      );
      return reply.send({ proposal });
    }
  );

  app.delete(
    "/api/proposals/:id/items/:itemId",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id, itemId } = request.params as { id: string; itemId: string };
      const proposal = await proposalService.deleteItem(
        Number(id),
        Number(itemId),
        request.user!.userId
      );
      return reply.send({ proposal });
    }
  );
}
