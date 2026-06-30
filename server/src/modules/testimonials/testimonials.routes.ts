import { FastifyInstance } from "fastify";
import {
  createTestimonialSchema,
  updateTestimonialSchema,
} from "./testimonials.schema";
import * as testimonialsService from "./testimonials.service";
import { authMiddleware, requireAdmin } from "../../plugins/auth";

export async function testimonialsRoutes(app: FastifyInstance) {
  app.get("/api/testimonials", async (_request, reply) => {
    const testimonials = await testimonialsService.listTestimonials();
    return reply.send({ testimonials });
  });

  app.post(
    "/api/testimonials",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const parsed = createTestimonialSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const testimonial = await testimonialsService.createTestimonial(
        parsed.data
      );
      return reply.status(201).send({ testimonial });
    }
  );

  app.put(
    "/api/testimonials/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateTestimonialSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const testimonial = await testimonialsService.updateTestimonial(
        Number(id),
        parsed.data
      );
      return reply.send({ testimonial });
    }
  );

  app.delete(
    "/api/testimonials/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await testimonialsService.deleteTestimonial(Number(id));
      return reply.status(204).send();
    }
  );
}
