import Fastify from "fastify";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "path";
import fs from "fs";
import { registerCors } from "./plugins/cors";
import { registerErrorHandler } from "./plugins/error-handler";
import { authMiddleware } from "./plugins/auth";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { servicesRoutes } from "./modules/services/services.routes";
import { contactsRoutes } from "./modules/contacts/contacts.routes";
import { projectsRoutes } from "./modules/projects/projects.routes";
import { testimonialsRoutes } from "./modules/testimonials/testimonials.routes";
import { proposalsRoutes } from "./modules/proposals/proposal.routes";

const UPLOADS_DIR = path.resolve(__dirname, "..", "public", "uploads");

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cookie);
  app.register(multipart);

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  app.register(fastifyStatic, {
    root: path.resolve(__dirname, "..", "public"),
    prefix: "/uploads/",
    decorateReply: false,
  });

  registerErrorHandler(app);

  app.register(async (instance) => {
    await registerCors(instance);
    await authRoutes(instance);
    await usersRoutes(instance);
    await servicesRoutes(instance);
    await contactsRoutes(instance);
    await projectsRoutes(instance);
    await testimonialsRoutes(instance);
    await proposalsRoutes(instance);
  });

  app.post(
    "/api/upload",
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const data = await request.file();
        if (!data) {
          return reply.status(400).send({ error: "Nenhum arquivo enviado" });
        }

        const ext = path.extname(data.filename) || ".png";
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        const filepath = path.join(UPLOADS_DIR, filename);

        const buffer = await data.toBuffer();
        fs.writeFileSync(filepath, buffer);

        return reply.send({ url: `http://localhost:3001/uploads/${filename}` });
      } catch {
        return reply.status(500).send({ error: "Erro ao processar upload" });
      }
    }
  );

  app.get("/api/health", async () => {
    return { status: "ok" };
  });

  return app;
}
