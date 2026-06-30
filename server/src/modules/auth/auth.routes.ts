import { FastifyInstance } from "fastify";
import { loginSchema } from "./auth.schema";
import * as authService from "./auth.service";
import { authMiddleware } from "../../plugins/auth";
import { loginRateLimit, clearRateLimit } from "../../plugins/rate-limit";

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/auth/login",
    { preHandler: loginRateLimit },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const result = await authService.login(
        parsed.data.username,
        parsed.data.password
      );

      reply.setCookie("auth-token", result.token, {
        httpOnly: true,
        maxAge: 86400,
        path: "/",
        sameSite: "lax",
      });

      clearRateLimit(request.ip);

      return reply.send({ user: result.user });
    }
  );

  app.get(
    "/api/auth/me",
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const user = await authService.getUser(request.user!.userId);
        return reply.send({ user });
      } catch (err: any) {
        return reply.status(404).send({ error: err.message });
      }
    }
  );

  app.post(
    "/api/auth/logout",
    { preHandler: authMiddleware },
    async (_request, reply) => {
      reply.clearCookie("auth-token", { path: "/" });
      return reply.send({ message: "Logout realizado" });
    }
  );
}
