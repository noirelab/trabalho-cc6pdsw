import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { registerCors } from "./plugins/cors";
import { registerErrorHandler } from "./plugins/error-handler";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { servicesRoutes } from "./modules/services/services.routes";
import { contactsRoutes } from "./modules/contacts/contacts.routes";
import { projectsRoutes } from "./modules/projects/projects.routes";
import { testimonialsRoutes } from "./modules/testimonials/testimonials.routes";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cookie);

  registerErrorHandler(app);

  app.register(async (instance) => {
    await registerCors(instance);
    await authRoutes(instance);
    await usersRoutes(instance);
    await servicesRoutes(instance);
    await contactsRoutes(instance);
    await projectsRoutes(instance);
    await testimonialsRoutes(instance);
  });

  app.get("/api/health", async () => {
    return { status: "ok" };
  });

  return app;
}
