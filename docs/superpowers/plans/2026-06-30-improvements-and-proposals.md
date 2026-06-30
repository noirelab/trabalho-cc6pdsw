# Improvements + Proposal Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 improvement points (centralized errors, rate limiting, authorization, pagination, email normalization) plus a full proposal/quotations module with state machine, server-side calculation, history tracking, auto-expiry, management reports, and frontend UI.

**Architecture:** Backend follows the existing 3-file module pattern (schema → service → routes). New centralized error classes thrown from services, caught by a global Fastify error handler. Role-based authorization via `requireAdmin` middleware. Shared pagination helper applied to all list endpoints. Proposal module structured identically to existing CRUD modules but with business rule enforcement in the service layer.

**Tech Stack:** Fastify 4, Prisma 5, SQLite, JWT, bcryptjs, Zod, Next.js 14, React Hook Form, shadcn/ui

---

### Task 1: Centralized Error Classes

**Files:**
- Create: `server/src/lib/errors.ts`

- [ ] **Step 1: Create error classes**

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(message, 403);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Muitas tentativas. Tente novamente mais tarde.") {
    super(message, 429);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/lib/errors.ts
git commit -m "feat: add centralized error classes"
```

---

### Task 2: Global Error Handler Plugin

**Files:**
- Create: `server/src/plugins/error-handler.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create error handler plugin**

```ts
import { FastifyInstance } from "fastify";
import { AppError } from "../lib/errors";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      const body: Record<string, unknown> = {
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
      };

      if ("details" in error && error.details !== undefined) {
        body.details = error.details;
      }

      return reply.status(error.statusCode).send(body);
    }

    // Unexpected errors — log and return generic 500
    if (error instanceof Error) {
      app.log.error(error);
    }

    return reply.status(500).send({
      error: "InternalError",
      message: "Erro interno do servidor",
      statusCode: 500,
    });
  });
}
```

- [ ] **Step 2: Register in app.ts**

Read `server/src/app.ts`, add import and registration call.

```ts
import { registerErrorHandler } from "./plugins/error-handler";
```

After `app.register(cookie)`, add:

```ts
registerErrorHandler(app);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/plugins/error-handler.ts server/src/app.ts
git commit -m "feat: add global error handler plugin"
```

---

### Task 3: Update Auth Plugin — add `role` to JWT and `requireAdmin` middleware

**Files:**
- Modify: `server/src/plugins/auth.ts`

- [ ] **Step 1: Update auth.ts**

Add `role` to JwtPayload, add `requireAdmin` middleware, and update `authMiddleware` to throw errors:

```ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "../lib/errors";

const JWT_SECRET = process.env.JWT_SECRET || "unobtainium-super-secret";

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const token = request.cookies["auth-token"];

  if (!token) {
    throw new UnauthorizedError("Não autenticado");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    request.user = payload;
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado");
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  if (!request.user || request.user.role !== "admin") {
    throw new ForbiddenError("Acesso restrito a administradores");
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}
```

Remove the `declare module "fastify"` block from this file — it will be added to `server.ts` or a separate `.d.ts` file later.

- [ ] **Step 2: Add Fastify type augmentation**

Create `server/src/types.d.ts`:

```ts
import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      userId: number;
      username: string;
      role: string;
    };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/plugins/auth.ts server/src/types.d.ts
git commit -m "feat: add role to JWT payload and requireAdmin middleware"
```

---

### Task 4: Rate Limiting Plugin

**Files:**
- Create: `server/src/plugins/rate-limit.ts`
- Modify: `server/src/modules/auth/auth.routes.ts`

- [ ] **Step 1: Create rate-limit.ts**

```ts
import { FastifyRequest, FastifyReply } from "fastify";
import { RateLimitError } from "../lib/errors";

const attempts = new Map<string, { count: number; firstAttempt: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export async function loginRateLimit(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const ip = request.ip;
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return;
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    throw new RateLimitError();
  }

  entry.count++;
}

export function loginRateLimitHook(
  _request: FastifyRequest,
  _reply: FastifyReply,
  _payload: unknown,
  done: () => void
) {
  // Only reset on success — the onSend hook only resets on 200
  done();
}
```

- [ ] **Step 2: Apply to login route**

In `server/src/modules/auth/auth.routes.ts`, add import:

```ts
import { loginRateLimit } from "../../plugins/rate-limit";
```

Update the login POST route's preHandler:

```ts
app.post(
  "/api/auth/login",
  { preHandler: loginRateLimit },
  async (request, reply) => {
```

In `auth.routes.ts`, import `clearRateLimit` and call it after successful login:

```ts
import { loginRateLimit, clearRateLimit } from "../../plugins/rate-limit";
```

Inside the login handler, after `reply.setCookie(...)`:

```ts
clearRateLimit(request.ip);
```

On success we clear the counter. On failure the counter stays (handled by the rate-limit preHandler).

- [ ] **Step 3: Commit**

```bash
git add server/src/plugins/rate-limit.ts server/src/modules/auth/auth.routes.ts
git commit -m "feat: add login rate limiting (5 attempts per 15 min)"
```

---

### Task 5: Authorization — Update User Schema, Auth Service, and All Routes

**Files:**
- Modify: `server/prisma/schema.prisma` (add `role` field)
- Modify: `server/prisma/seed.ts` (add `role: "admin"` to admin user)
- Modify: `server/src/modules/auth/auth.service.ts` (include `role` in JWT)
- Modify: `server/src/modules/users/users.routes.ts` (add requireAdmin on GET/POST/DELETE, self-or-admin on PUT)
- Modify: `server/src/modules/services/services.routes.ts` (add requireAdmin on POST/PUT/DELETE)
- Modify: `server/src/modules/contacts/contacts.routes.ts` (add requireAdmin on PUT/DELETE)
- Modify: `server/src/modules/projects/projects.routes.ts` (add requireAdmin on POST/PUT/DELETE)
- Modify: `server/src/modules/testimonials/testimonials.routes.ts` (add requireAdmin on POST/PUT/DELETE)

- [ ] **Step 1: Add role to User schema**

In `server/prisma/schema.prisma`, add after `password` in the `User` model:

```
  role      String   @default("user")
```

- [ ] **Step 2: Run migration**

```bash
cd server && npx prisma migrate dev --name add-user-role
```

Expected: creates migration, applies to SQLite.

- [ ] **Step 3: Update seed**

In `server/prisma/seed.ts`, add `role: "admin"` to the admin user create data:

```ts
const admin = await prisma.user.upsert({
  where: { username: "admin" },
  update: {},
  create: {
    username: "admin",
    password: hashedPassword,
    name: "Administrador",
    role: "admin",
  },
});
```

- [ ] **Step 4: Update auth.service.ts**

In `server/src/modules/auth/auth.service.ts`, update the JWT payload to include `role`:

```ts
const payload: JwtPayload = {
  userId: user.id,
  username: user.username,
  role: user.role,
};
```

- [ ] **Step 5: Update users.routes.ts — add requireAdmin**

Import `requireAdmin`:

```ts
import { authMiddleware, requireAdmin } from "../../plugins/auth";
```

Change GET and POST to use `{ preHandler: [authMiddleware, requireAdmin] }`.

Change DELETE to use `{ preHandler: [authMiddleware, requireAdmin] }`.

For PUT `/api/users/:id`: allow self or admin. Inside the handler, before calling the service:

```ts
const userId = Number(id);
if (request.user!.userId !== userId && request.user!.role !== "admin") {
  throw new ForbiddenError("Você só pode editar seu próprio perfil");
}
```

Add import:
```ts
import { ForbiddenError } from "../../lib/errors";
```

- [ ] **Step 6: Update services.routes.ts — add requireAdmin on POST/PUT/DELETE**

Import `requireAdmin` and change `preHandler: authMiddleware` to `preHandler: [authMiddleware, requireAdmin]` on POST, PUT, and DELETE routes.

- [ ] **Step 7: Update contacts.routes.ts — add requireAdmin on PUT/DELETE**

Import `requireAdmin` and change `preHandler: authMiddleware` to `preHandler: [authMiddleware, requireAdmin]` on PUT and DELETE routes. GET `/api/contacts` already uses authMiddleware, keep it but add requireAdmin (since reading contacts is an admin operation).

- [ ] **Step 8: Update projects.routes.ts — add requireAdmin on POST/PUT/DELETE**

Import `requireAdmin` and change `preHandler: authMiddleware` to `preHandler: [authMiddleware, requireAdmin]` on POST, PUT, and DELETE routes.

- [ ] **Step 9: Update testimonials.routes.ts — add requireAdmin on POST/PUT/DELETE**

Import `requireAdmin` and change `preHandler: authMiddleware` to `preHandler: [authMiddleware, requireAdmin]` on POST, PUT, and DELETE routes.

- [ ] **Step 10: Re-run seed**

```bash
cd server && npx tsx prisma/seed.ts
```

Expected: admin user created with role "admin", 3 services, 3 projects, 3 testimonials.

- [ ] **Step 11: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/ server/prisma/seed.ts server/src/modules/auth/auth.service.ts server/src/modules/users/users.routes.ts server/src/modules/services/services.routes.ts server/src/modules/contacts/contacts.routes.ts server/src/modules/projects/projects.routes.ts server/src/modules/testimonials/testimonials.routes.ts
git commit -m "feat: add role-based authorization (admin/user) with requireAdmin middleware"
```

---

### Task 6: Convert Existing Modules to Use Centralized Errors

**Files:**
- Modify: All service files and route files that throw/return errors

- [ ] **Step 1: Update auth.service.ts**

Replace `throw new Error("Credenciais inválidas")` with:
```ts
import { UnauthorizedError, NotFoundError } from "../../lib/errors";
```

```ts
if (!user) {
  throw new UnauthorizedError("Credenciais inválidas");
}
```

```ts
if (!valid) {
  throw new UnauthorizedError("Credenciais inválidas");
}
```

In `getUser`:
```ts
if (!user) {
  throw new NotFoundError("Usuário não encontrado");
}
```

- [ ] **Step 2: Update auth.routes.ts**

Remove inline `try/catch` blocks from login and me routes — the global error handler catches them. The Zod validation (`safeParse`) stays as-is.

Updated login route:
```ts
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
```

Updated me route (remove try/catch):
```ts
app.get(
  "/api/auth/me",
  { preHandler: authMiddleware },
  async (request, reply) => {
    const user = await authService.getUser(request.user!.userId);
    return reply.send({ user });
  }
);
```

- [ ] **Step 3: Update users.service.ts**

Replace all `throw new Error(...)` with:
```ts
import { NotFoundError, ValidationError } from "../../lib/errors";
```

```ts
if (existing) {
  throw new ValidationError("Usuário já existe");
}
```

```ts
if (!user) throw new NotFoundError("Usuário não encontrado");
```

- [ ] **Step 4: Update users.routes.ts**

Remove try/catch blocks from routes. The global error handler now catches `NotFoundError`, `ValidationError`, etc. Keep Zod validation inline (it's a different pattern).

Updated PUT route:
```ts
app.put(
  "/api/users/:id",
  { preHandler: authMiddleware },
  async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = Number(id);
    const parsed = updateUserSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    if (request.user!.userId !== userId && request.user!.role !== "admin") {
      throw new ForbiddenError("Você só pode editar seu próprio perfil");
    }

    const user = await usersService.updateUser(userId, parsed.data);
    return reply.send({ user });
  }
);
```

Updated DELETE route:
```ts
app.delete(
  "/api/users/:id",
  { preHandler: [authMiddleware, requireAdmin] },
  async (request, reply) => {
    const { id } = request.params as { id: string };
    await usersService.deleteUser(Number(id));
    return reply.status(204).send();
  }
);
```

- [ ] **Step 5: Update services.service.ts**

Replace errors:
```ts
import { NotFoundError } from "../../lib/errors";
```

```ts
if (!service) throw new NotFoundError("Serviço não encontrado");
```

- [ ] **Step 6: Update services.routes.ts**

Remove try/catch from GET `/:id`, PUT, DELETE routes. Keep Zod validation inline.

- [ ] **Step 7: Update contacts.service.ts**

Replace errors:
```ts
import { NotFoundError } from "../../lib/errors";
```

```ts
if (!contact) throw new NotFoundError("Contato não encontrado");
```

- [ ] **Step 8: Update contacts.routes.ts**

Remove try/catch from PUT, DELETE routes. Keep Zod validation inline.

- [ ] **Step 9: Update projects.service.ts**

Replace errors:
```ts
import { NotFoundError } from "../../lib/errors";
```

```ts
if (!project) throw new NotFoundError("Projeto não encontrado");
```

- [ ] **Step 10: Update projects.routes.ts**

Remove try/catch from PUT, DELETE routes.

- [ ] **Step 11: Update testimonials.service.ts**

Replace errors:
```ts
import { NotFoundError } from "../../lib/errors";
```

```ts
if (!testimonial) throw new NotFoundError("Depoimento não encontrado");
```

- [ ] **Step 12: Update testimonials.routes.ts**

Remove try/catch from PUT, DELETE routes.

- [ ] **Step 13: Commit**

```bash
git add server/src/modules/
git commit -m "refactor: convert all modules to centralized error handling"
```

---

### Task 7: Pagination Helper

**Files:**
- Create: `server/src/lib/pagination.ts`
- Modify: All 5 service files (add paginated list methods)
- Modify: All 5 route files (update GET list endpoints)

- [ ] **Step 1: Create pagination.ts**

```ts
export interface PaginationParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const VALID_SORT_FIELDS: Record<string, string[]> = {
  users: ["id", "username", "name", "createdAt"],
  services: ["id", "title", "createdAt", "updatedAt"],
  contacts: ["id", "name", "email", "createdAt"],
  projects: ["id", "title", "createdAt", "updatedAt"],
  testimonials: ["id", "name", "role", "createdAt"],
  proposals: ["id", "title", "clientName", "status", "total", "createdAt", "updatedAt"],
};

export function parsePagination(
  query: Record<string, unknown>,
  moduleName: string
): PaginationParams {
  const allowedSorts = VALID_SORT_FIELDS[moduleName] || VALID_SORT_FIELDS.services;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const sort = String(query.sort || "createdAt");
  const order = (String(query.order || "desc") === "asc" ? "asc" : "desc") as "asc" | "desc";
  const search = String(query.search || "").trim();

  return {
    page,
    limit,
    sort: allowedSorts.includes(sort) ? sort : "createdAt",
    order,
    search,
  };
}

export function buildSearchFilter(search: string, fields: string[]) {
  if (!search) return {};
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search },
    })),
  };
}
```

- [ ] **Step 2: Update users.service.ts — add paginated list**

```ts
import { parsePagination, buildSearchFilter, PaginatedResult } from "../../lib/pagination";

export async function listUsersPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>> {
  const { page, limit, sort, order, search } = parsePagination(query, "users");
  const where = buildSearchFilter(search, ["username", "name"]);

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, username: true, name: true, role: true, createdAt: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sort]: order },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

Also keep the old `listUsers()` for backwards compat, or replace it. Replace it — update the routes.

- [ ] **Step 3: Update users.routes.ts — use paginated list**

```ts
app.get(
  "/api/users",
  { preHandler: [authMiddleware, requireAdmin] },
  async (request, reply) => {
    const result = await usersService.listUsersPaginated(request.query as Record<string, unknown>);
    return reply.send(result);
  }
);
```

- [ ] **Step 4: Update services.service.ts — add paginated list**

```ts
import { parsePagination, buildSearchFilter, PaginatedResult } from "../../lib/pagination";

export async function listServicesPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>> {
  const { page, limit, sort, order, search } = parsePagination(query, "services");
  const where = buildSearchFilter(search, ["title", "description"]);

  const [data, total] = await Promise.all([
    prisma.service.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
    prisma.service.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

- [ ] **Step 5: Update services.routes.ts — use paginated list**

Public endpoint uses pagination:
```ts
app.get("/api/services", async (request, reply) => {
  const result = await servicesService.listServicesPaginated(request.query as Record<string, unknown>);
  return reply.send(result);
});
```

- [ ] **Step 6: Update contacts.service.ts — add paginated list**

```ts
import { parsePagination, buildSearchFilter, PaginatedResult } from "../../lib/pagination";

export async function listContactsPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>> {
  const { page, limit, sort, order, search } = parsePagination(query, "contacts");
  const where = buildSearchFilter(search, ["name", "email", "message"]);

  const [data, total] = await Promise.all([
    prisma.contact.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
    prisma.contact.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

- [ ] **Step 7: Update contacts.routes.ts — use paginated list**

```ts
app.get(
  "/api/contacts",
  { preHandler: [authMiddleware, requireAdmin] },
  async (request, reply) => {
    const result = await contactsService.listContactsPaginated(request.query as Record<string, unknown>);
    return reply.send(result);
  }
);
```

- [ ] **Step 8: Update projects.service.ts — add paginated list**

```ts
import { parsePagination, buildSearchFilter, PaginatedResult } from "../../lib/pagination";

export async function listProjectsPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>> {
  const { page, limit, sort, order, search } = parsePagination(query, "projects");
  const where = buildSearchFilter(search, ["title", "description"]);

  const [data, total] = await Promise.all([
    prisma.project.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
    prisma.project.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

- [ ] **Step 9: Update projects.routes.ts — use paginated list**

```ts
app.get("/api/projects", async (request, reply) => {
  const result = await projectsService.listProjectsPaginated(request.query as Record<string, unknown>);
  return reply.send(result);
});
```

- [ ] **Step 10: Update testimonials.service.ts — add paginated list**

```ts
import { parsePagination, buildSearchFilter, PaginatedResult } from "../../lib/pagination";

export async function listTestimonialsPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>> {
  const { page, limit, sort, order, search } = parsePagination(query, "testimonials");
  const where = buildSearchFilter(search, ["name", "role", "text"]);

  const [data, total] = await Promise.all([
    prisma.testimonial.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
    prisma.testimonial.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

- [ ] **Step 11: Update testimonials.routes.ts — use paginated list**

```ts
app.get("/api/testimonials", async (request, reply) => {
  const result = await testimonialsService.listTestimonialsPaginated(request.query as Record<string, unknown>);
  return reply.send(result);
});
```

- [ ] **Step 12: Commit**

```bash
git add server/src/lib/pagination.ts server/src/modules/
git commit -m "feat: add pagination, sorting, and search to all list endpoints"
```

---

### Task 8: Email Normalization

**Files:**
- Modify: `server/src/modules/contacts/contacts.service.ts`

- [ ] **Step 1: Normalize email in createContact**

In `createContact`, before `prisma.contact.create`:

```ts
export async function createContact(data: CreateContactInput) {
  return prisma.contact.create({
    data: {
      ...data,
      email: data.email.trim().toLowerCase(),
    },
  });
}
```

Also normalize in `updateContact`:

```ts
export async function updateContact(id: number, data: UpdateContactInput) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) throw new NotFoundError("Contato não encontrado");

  const updateData: any = { ...data };
  if (data.email) {
    updateData.email = data.email.trim().toLowerCase();
  }

  return prisma.contact.update({ where: { id }, data: updateData });
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/modules/contacts/contacts.service.ts
git commit -m "feat: normalize email (trim + lowercase) on contact save"
```

---

### Task 9: Add Price Field to Service Model

**Files:**
- Modify: `server/prisma/schema.prisma`
- Modify: `server/prisma/seed.ts`
- Modify: `server/src/modules/services/services.schema.ts`
- Modify: `server/src/modules/services/services.service.ts`
- Modify: `server/src/modules/services/services.routes.ts`

- [ ] **Step 1: Add price to Service in schema.prisma**

Add after `description`:
```
  price     Float    @default(0)
```

- [ ] **Step 2: Run migration**

```bash
cd server && npx prisma migrate dev --name add-service-price
```

- [ ] **Step 3: Update seed**

Add prices to services in `server/prisma/seed.ts`:
```ts
const services = [
  {
    title: "Desenvolvimento Web",
    description: "Criação de portais corporativos e web apps escaláveis com as tecnologias mais modernas do mercado.",
    price: 15000,
  },
  {
    title: "Design UI/UX",
    description: "Interfaces minimalistas focadas em acessibilidade, usabilidade e conversão de usuários.",
    price: 8000,
  },
  {
    title: "Auditoria de Código",
    description: "Revisão e melhoria de bases de código legadas, identificando bugs, vulnerabilidades e débitos técnicos.",
    price: 5000,
  },
];
```

- [ ] **Step 4: Update services.schema.ts**

Add `price` to create and update schemas:

```ts
import { z } from "zod";

export const createServiceSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.number().min(0, "Preço deve ser >= 0"),
});

export const updateServiceSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
```

- [ ] **Step 5: Re-run seed**

```bash
cd server && npx tsx prisma/seed.ts
```

- [ ] **Step 6: Commit**

```bash
git add server/prisma/ server/src/modules/services/
git commit -m "feat: add price field to Service model"
```

---

### Task 10: Proposal Module — Schema + Service + Routes

**Files:**
- Modify: `server/prisma/schema.prisma` (add Proposal, ProposalItem, ProposalHistory models)
- Create: `server/src/modules/proposals/proposal.schema.ts`
- Create: `server/src/modules/proposals/proposal.service.ts`
- Create: `server/src/modules/proposals/proposal.routes.ts`
- Modify: `server/src/app.ts` (register proposal routes)

- [ ] **Step 1: Add Proposal models to schema.prisma**

Add after the Testimonial model:

```prisma
model Proposal {
  id          Int      @id @default(autoincrement())
  title       String
  clientName  String
  clientEmail String
  subtotal    Float    @default(0)
  discount    Float    @default(0)
  total       Float    @default(0)
  status      String   @default("draft")
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  items       ProposalItem[]
  history     ProposalHistory[]
}

model ProposalItem {
  id         Int      @id @default(autoincrement())
  proposalId Int
  serviceId  Int
  quantity   Int      @default(1)
  unitPrice  Float
  subtotal   Float    @default(0)
  createdAt  DateTime @default(now())
  proposal   Proposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  service    Service  @relation(fields: [serviceId], references: [id])
}

model ProposalHistory {
  id         Int      @id @default(autoincrement())
  proposalId Int
  userId     Int
  field      String
  oldValue   String?
  newValue   String
  createdAt  DateTime @default(now())
  proposal   Proposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id])
}
```

- [ ] **Step 2: Run migration**

```bash
cd server && npx prisma migrate dev --name add-proposal-models
```

- [ ] **Step 3: Create proposal.schema.ts**

```ts
import { z } from "zod";

export const createProposalSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  clientName: z.string().min(1, "Nome do cliente é obrigatório"),
  clientEmail: z.string().email("Email inválido"),
  notes: z.string().optional(),
  discount: z.number().min(0).optional(),
  items: z.array(
    z.object({
      serviceId: z.number().int().positive(),
      quantity: z.number().int().min(1).default(1),
    })
  ).min(1, "Adicione pelo menos um serviço"),
});

export const updateProposalSchema = z.object({
  title: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email("Email inválido").optional(),
  notes: z.string().optional(),
  discount: z.number().min(0).optional(),
});

export const statusTransitionSchema = z.object({
  status: z.enum(["sent", "accepted", "rejected"]),
});

export const addItemSchema = z.object({
  serviceId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().min(1),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
```

- [ ] **Step 4: Create proposal.service.ts**

```ts
import prisma from "../../lib/prisma";
import { NotFoundError, ValidationError, ForbiddenError } from "../../lib/errors";
import { parsePagination, buildSearchFilter, PaginatedResult } from "../../lib/pagination";
import {
  CreateProposalInput,
  UpdateProposalInput,
  StatusTransitionInput,
  AddItemInput,
  UpdateItemInput,
} from "./proposal.schema";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent"],
  sent: ["accepted", "rejected"],
};

function validateTransition(current: string, next: string) {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(next)) {
    throw new ValidationError(
      `Transição inválida: ${current} → ${next}`
    );
  }
}

async function recalcProposal(proposalId: number) {
  const items = await prisma.proposalItem.findMany({ where: { proposalId } });
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) return;

  const total = Math.max(0, subtotal - proposal.discount);

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { subtotal, total },
  });
}

export async function listProposalsPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>> {
  const { page, limit, sort, order, search } = parsePagination(query, "proposals");
  const status = query.status as string | undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { clientName: { contains: search } },
      { clientEmail: { contains: search } },
    ];
  }
  if (status && ["draft", "sent", "accepted", "rejected", "expired"].includes(status)) {
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.proposal.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
    prisma.proposal.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getProposalById(id: number) {
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      items: { include: { service: true } },
      history: {
        include: { user: { select: { id: true, username: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!proposal) throw new NotFoundError("Proposta não encontrada");
  return proposal;
}

export async function createProposal(data: CreateProposalInput, userId: number) {
  const { items, discount, ...proposalData } = data;

  // Validate all serviceIds exist and fetch prices
  const serviceIds = items.map((i) => i.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  });

  if (services.length !== serviceIds.length) {
    throw new ValidationError("Um ou mais serviços não foram encontrados");
  }

  const serviceMap = new Map(services.map((s) => [s.id, s]));

  const proposal = await prisma.$transaction(async (tx) => {
    const p = await tx.proposal.create({
      data: {
        ...proposalData,
        clientEmail: proposalData.clientEmail.trim().toLowerCase(),
        discount: discount ?? 0,
      },
    });

    for (const item of items) {
      const service = serviceMap.get(item.serviceId)!;
      await tx.proposalItem.create({
        data: {
          proposalId: p.id,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: service.price,
          subtotal: item.quantity * service.price,
        },
      });
    }

    await tx.proposalHistory.create({
      data: {
        proposalId: p.id,
        userId,
        field: "status",
        oldValue: null,
        newValue: "draft",
      },
    });

    return p;
  });

  await recalcProposal(proposal.id);

  return getProposalById(proposal.id);
}

export async function updateProposal(id: number, data: UpdateProposalInput) {
  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");

  if (proposal.status !== "draft") {
    throw new ForbiddenError("Apenas propostas em rascunho podem ser editadas");
  }

  const updateData: any = { ...data };
  if (data.clientEmail) {
    updateData.clientEmail = data.clientEmail.trim().toLowerCase();
  }

  await prisma.proposal.update({ where: { id }, data: updateData });

  if (data.discount !== undefined) {
    await recalcProposal(id);
  }

  return getProposalById(id);
}

export async function transitionStatus(id: number, input: StatusTransitionInput, userId: number) {
  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");

  validateTransition(proposal.status, input.status);

  await prisma.$transaction(async (tx) => {
    await tx.proposal.update({
      where: { id },
      data: { status: input.status },
    });

    await tx.proposalHistory.create({
      data: {
        proposalId: id,
        userId,
        field: "status",
        oldValue: proposal.status,
        newValue: input.status,
      },
    });
  });

  return getProposalById(id);
}

export async function addItem(proposalId: number, data: AddItemInput, userId: number) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");
  if (proposal.status !== "draft") {
    throw new ForbiddenError("Apenas propostas em rascunho podem ser editadas");
  }

  const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
  if (!service) throw new NotFoundError("Serviço não encontrado");

  await prisma.$transaction(async (tx) => {
    await tx.proposalItem.create({
      data: {
        proposalId,
        serviceId: data.serviceId,
        quantity: data.quantity,
        unitPrice: service.price,
        subtotal: data.quantity * service.price,
      },
    });

    await tx.proposalHistory.create({
      data: {
        proposalId,
        userId,
        field: "items",
        oldValue: null,
        newValue: `Adicionado serviço #${data.serviceId} (qty: ${data.quantity})`,
      },
    });
  });

  await recalcProposal(proposalId);
  return getProposalById(proposalId);
}

export async function updateItem(proposalId: number, itemId: number, data: UpdateItemInput, userId: number) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");
  if (proposal.status !== "draft") {
    throw new ForbiddenError("Apenas propostas em rascunho podem ser editadas");
  }

  const item = await prisma.proposalItem.findUnique({ where: { id: itemId } });
  if (!item || item.proposalId !== proposalId) throw new NotFoundError("Item não encontrado");

  const newSubtotal = data.quantity * item.unitPrice;

  await prisma.$transaction(async (tx) => {
    await tx.proposalItem.update({
      where: { id: itemId },
      data: { quantity: data.quantity, subtotal: newSubtotal },
    });

    await tx.proposalHistory.create({
      data: {
        proposalId,
        userId,
        field: "items",
        oldValue: `Serviço #${item.serviceId} qty: ${item.quantity}`,
        newValue: `Serviço #${item.serviceId} qty: ${data.quantity}`,
      },
    });
  });

  await recalcProposal(proposalId);
  return getProposalById(proposalId);
}

export async function deleteItem(proposalId: number, itemId: number, userId: number) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");
  if (proposal.status !== "draft") {
    throw new ForbiddenError("Apenas propostas em rascunho podem ser editadas");
  }

  const item = await prisma.proposalItem.findUnique({ where: { id: itemId } });
  if (!item || item.proposalId !== proposalId) throw new NotFoundError("Item não encontrado");

  await prisma.$transaction(async (tx) => {
    await tx.proposalItem.delete({ where: { id: itemId } });

    await tx.proposalHistory.create({
      data: {
        proposalId,
        userId,
        field: "items",
        oldValue: `Serviço #${item.serviceId} (qty: ${item.quantity})`,
        newValue: "Removido",
      },
    });
  });

  await recalcProposal(proposalId);
  return getProposalById(proposalId);
}

export async function deleteProposal(id: number) {
  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");
  await prisma.proposal.delete({ where: { id } });
}

export async function getReports() {
  const proposals = await prisma.proposal.findMany();

  const byStatus = { draft: 0, sent: 0, accepted: 0, rejected: 0, expired: 0 };
  let totalRevenue = 0;

  for (const p of proposals) {
    byStatus[p.status as keyof typeof byStatus]++;
    if (p.status === "accepted") {
      totalRevenue += p.total;
    }
  }

  const resolved = byStatus.accepted + byStatus.rejected;
  const conversionRate = resolved > 0 ? byStatus.accepted / resolved : 0;

  return {
    totalProposals: proposals.length,
    byStatus,
    totalRevenue,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}

export async function expireOverdue() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const updated = await prisma.proposal.updateMany({
    where: {
      status: "sent",
      updatedAt: { lt: sevenDaysAgo },
    },
    data: { status: "expired" },
  });

  return updated.count;
}
```

- [ ] **Step 5: Create proposal.routes.ts**

```ts
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
  // List with pagination
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

  // Reports
  app.get(
    "/api/proposals/reports",
    { preHandler: [authMiddleware, requireAdmin] },
    async (_request, reply) => {
      const reports = await proposalService.getReports();
      return reply.send(reports);
    }
  );

  // Get by ID
  app.get(
    "/api/proposals/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const proposal = await proposalService.getProposalById(Number(id));
      return reply.send({ proposal });
    }
  );

  // Create
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

  // Update (draft only)
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

  // Status transition
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

  // Delete
  app.delete(
    "/api/proposals/:id",
    { preHandler: [authMiddleware, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await proposalService.deleteProposal(Number(id));
      return reply.status(204).send();
    }
  );

  // Add item
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

  // Update item quantity
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

  // Delete item
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
```

- [ ] **Step 6: Register routes in app.ts**

In `server/src/app.ts`, add import:
```ts
import { proposalsRoutes } from "./modules/proposals/proposal.routes";
```

Add after `testimonialsRoutes`:
```ts
await proposalsRoutes(instance);
```

- [ ] **Step 7: Commit**

```bash
git add server/prisma/ server/src/modules/proposals/ server/src/app.ts
git commit -m "feat: add proposal module with state machine, items, history, reports"
```

---

### Task 11: Auto-Expiry Cron

**Files:**
- Modify: `server/src/server.ts`

- [ ] **Step 1: Add expiry cron to server.ts**

After `await app.listen(...)`, add:

```ts
import { expireOverdue } from "./modules/proposals/proposal.service";
```

Inside `main()`, after `await app.listen(...)`:

```ts
setInterval(async () => {
  try {
    const count = await expireOverdue();
    if (count > 0) {
      console.log(`[expiry] ${count} propostas expiradas automaticamente`);
    }
  } catch (err) {
    app.log.error(err, "Erro ao expirar propostas");
  }
}, 60_000);
```

Full updated `server.ts`:

```ts
import "dotenv/config";
import { buildApp } from "./app";
import { expireOverdue } from "./modules/proposals/proposal.service";

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  const app = buildApp();

  try {
    await app.listen({ port: PORT });
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  setInterval(async () => {
    try {
      const count = await expireOverdue();
      if (count > 0) {
        console.log(`[expiry] ${count} propostas expiradas automaticamente`);
      }
    } catch (err) {
      app.log.error(err, "Erro ao expirar propostas");
    }
  }, 60_000);
}

main();
```

- [ ] **Step 2: Commit**

```bash
git add server/src/server.ts
git commit -m "feat: add auto-expiry cron for overdue proposals"
```

---

### Task 12: Frontend — Update Dashboard for Paginated Responses

**Files:**
- Modify: `src/app/dashboard/dashboard-content.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/services/page.tsx`
- Modify: `src/app/projects/page.tsx`

- [ ] **Step 1: Update dashboard fetch functions for new response shape**

The paginated API returns `{ data, total, page, limit, totalPages }` instead of `{ services }`, etc. Update the fetch functions in `dashboard-content.tsx`:

```tsx
const fetchServices = useCallback(async () => {
  try {
    const res = await fetch(`${API_URL}/api/services`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setServices(json.data);
    }
  } catch {}
}, []);

const fetchContacts = useCallback(async () => {
  try {
    const res = await fetch(`${API_URL}/api/contacts`, { credentials: "include" });
    if (res.ok) {
      const json = await res.json();
      setContacts(json.data);
    }
  } catch {}
}, []);

const fetchProjects = useCallback(async () => {
  try {
    const res = await fetch(`${API_URL}/api/projects`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setProjects(json.data);
    }
  } catch {}
}, []);

const fetchTestimonials = useCallback(async () => {
  try {
    const res = await fetch(`${API_URL}/api/testimonials`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setTestimonials(json.data);
    }
  } catch {}
}, []);
```

- [ ] **Step 2: Update public pages for new response shape**

In `src/app/page.tsx`, update testimonials fetch:
```tsx
const data = await res.json();
const testimonials = data.data;
```

In `src/app/services/page.tsx`, update services fetch:
```tsx
const data = await res.json();
const services = data.data;
```

In `src/app/projects/page.tsx`, update projects fetch:
```tsx
const data = await res.json();
const projects = data.data;
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/dashboard-content.tsx src/app/page.tsx src/app/services/page.tsx src/app/projects/page.tsx
git commit -m "fix: update frontend to use paginated API response shape (data array)"
```

---

### Task 13: Frontend — Dashboard Orcamentos Tab

**Files:**
- Modify: `src/app/dashboard/dashboard-content.tsx`

- [ ] **Step 1: Add types and form schemas at the top of dashboard-content.tsx**

Add after existing interface definitions:

```tsx
interface Proposal {
  id: number;
  title: string;
  clientName: string;
  clientEmail: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ProposalItem[];
  history?: ProposalHistory[];
}

interface ProposalItem {
  id: number;
  proposalId: number;
  serviceId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  service: { id: number; title: string; price: number };
}

interface ProposalHistory {
  id: number;
  field: string;
  oldValue: string | null;
  newValue: string;
  createdAt: string;
  user: { id: number; username: string };
}

interface ProposalReports {
  totalProposals: number;
  byStatus: Record<string, number>;
  totalRevenue: number;
  conversionRate: number;
}
```

Replace the `Tab` type at the top:
```tsx
type Tab = "profile" | "services" | "contacts" | "projects" | "testimonials" | "proposals";
```

Add form schemas after existing schemas:
```tsx
const proposalSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  clientName: z.string().min(1, "Nome do cliente é obrigatório"),
  clientEmail: z.string().email("Email inválido"),
  notes: z.string().optional(),
  discount: z.number().min(0).optional(),
});
type ProposalFormData = z.infer<typeof proposalSchema>;
```

- [ ] **Step 2: Add state variables for proposals**

Add after existing state declarations:
```tsx
const [proposals, setProposals] = useState<Proposal[]>([]);
const [proposalReports, setProposalReports] = useState<ProposalReports | null>(null);
const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
const [proposalItems, setProposalItems] = useState<{ serviceId: number; quantity: number }[]>([]);
const [availableServices, setAvailableServices] = useState<{ id: number; title: string; price: number }[]>([]);
```

Add the form:
```tsx
const proposalForm = useForm<ProposalFormData>({ resolver: zodResolver(proposalSchema) });
```

- [ ] **Step 3: Add fetch functions for proposals**

```tsx
const fetchProposals = useCallback(async () => {
  try {
    const res = await fetch(`${API_URL}/api/proposals`, { credentials: "include" });
    if (res.ok) {
      const json = await res.json();
      setProposals(json.data);
    }
  } catch {}
}, []);

const fetchProposalReports = useCallback(async () => {
  try {
    const res = await fetch(`${API_URL}/api/proposals/reports`, { credentials: "include" });
    if (res.ok) setProposalReports(await res.json());
  } catch {}
}, []);

const fetchAvailableServices = useCallback(async () => {
  try {
    const res = await fetch(`${API_URL}/api/services?limit=100`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setAvailableServices(json.data);
    }
  } catch {}
}, []);
```

Add to the `init()` useEffect alongside existing fetches:
```tsx
await Promise.all([fetchUser(), fetchServices(), fetchContacts(), fetchProjects(), fetchTestimonials(), fetchProposals(), fetchProposalReports(), fetchAvailableServices()]);
```

Update the `useEffect` dependency array to include new fetch functions:
```tsx
}, [fetchUser, fetchServices, fetchContacts, fetchProjects, fetchTestimonials, fetchProposals, fetchProposalReports, fetchAvailableServices]);
```

- [ ] **Step 4: Add proposal handlers**

```tsx
async function onProposalSubmit(data: ProposalFormData) {
  setMsg("");
  try {
    const body: any = { ...data, items: proposalItems };
    const res = await fetch(`${API_URL}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      setMsg(err.message || err.error || "Erro");
      return;
    }
    setMsg("Proposta criada com sucesso");
    setEditingProposal(null);
    proposalForm.reset({ title: "", clientName: "", clientEmail: "", notes: "", discount: 0 });
    setProposalItems([]);
    await fetchProposals();
    await fetchProposalReports();
  } catch { setMsg("Erro de conexão"); }
}

async function transitionProposal(id: number, status: string) {
  setMsg("");
  try {
    const res = await fetch(`${API_URL}/api/proposals/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      setMsg(err.message || "Erro");
      return;
    }
    setMsg(`Proposta ${status === "sent" ? "enviada" : status === "accepted" ? "aceita" : "recusada"} com sucesso`);
    await fetchProposals();
    await fetchProposalReports();
  } catch { setMsg("Erro de conexão"); }
}

async function deleteProposal(id: number) {
  await fetch(`${API_URL}/api/proposals/${id}`, { method: "DELETE", credentials: "include" });
  await fetchProposals();
  await fetchProposalReports();
}

async function viewProposal(id: number) {
  setMsg("");
  try {
    const res = await fetch(`${API_URL}/api/proposals/${id}`, { credentials: "include" });
    if (res.ok) {
      const json = await res.json();
      setSelectedProposal(json.proposal);
    }
  } catch { setMsg("Erro de conexão"); }
}

function addProposalItem(serviceId: number) {
  const svc = availableServices.find((s) => s.id === serviceId);
  if (!svc) return;
  setProposalItems([...proposalItems, { serviceId: svc.id, quantity: 1 }]);
}

function updateProposalItemQuantity(index: number, quantity: number) {
  const updated = [...proposalItems];
  updated[index].quantity = Math.max(1, quantity);
  setProposalItems(updated);
}

function removeProposalItem(index: number) {
  setProposalItems(proposalItems.filter((_, i) => i !== index));
}

function calcProposalTotal(): number {
  const subtotal = proposalItems.reduce((sum, item) => {
    const svc = availableServices.find((s) => s.id === item.serviceId);
    return sum + (svc ? svc.price * item.quantity : 0);
  }, 0);
  const discount = proposalForm.watch("discount") || 0;
  return Math.max(0, subtotal - discount);
}
```

- [ ] **Step 5: Add "Orcamentos" tab to the tabs array**

```tsx
const tabs: { key: Tab; label: string }[] = [
  { key: "profile", label: "Perfil" },
  { key: "services", label: "Serviços" },
  { key: "contacts", label: "Contatos" },
  { key: "projects", label: "Projetos" },
  { key: "testimonials", label: "Depoimentos" },
  { key: "proposals", label: "Orçamentos" },
];
```

- [ ] **Step 6: Add the proposals tab JSX**

Add before the very last closing `</div>` of the return statement (before `</Card>` ending the last tab):

```tsx
{/* Orçamentos */}
{tab === "proposals" && (
  selectedProposal ? (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{selectedProposal.title}</CardTitle>
            <CardDescription>
              Cliente: {selectedProposal.clientName} ({selectedProposal.clientEmail})
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelectedProposal(null)}>Voltar</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-semibold text-sm uppercase">{selectedProposal.status}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="font-semibold text-sm">R$ {selectedProposal.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold text-sm text-green-700">R$ {selectedProposal.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-2">Itens da Proposta</h3>
          <div className="space-y-2">
            {selectedProposal.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-2 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{item.service.title}</p>
                  <p className="text-xs text-muted-foreground">R$ {item.unitPrice.toFixed(2)} x {item.quantity} = R$ {item.subtotal.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedProposal.history && selectedProposal.history.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Histórico</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {selectedProposal.history.map((h) => (
                <div key={h.id} className="text-xs text-muted-foreground flex justify-between p-1 border-b">
                  <span><strong>{h.user.username}</strong>: {h.field} — {h.oldValue || "—"} → {h.newValue}</span>
                  <span>{new Date(h.createdAt).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedProposal.notes && (
          <div>
            <h3 className="font-semibold text-sm mb-1">Observações</h3>
            <p className="text-sm text-muted-foreground">{selectedProposal.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Orçamentos</CardTitle>
        <CardDescription>Crie propostas comerciais com múltiplos serviços.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reports */}
        {proposalReports && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-700">{proposalReports.totalProposals}</p>
              <p className="text-xs text-blue-600">Total</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700">{proposalReports.byStatus.accepted}</p>
              <p className="text-xs text-green-600">Aceitas</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-700">R$ {proposalReports.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
              <p className="text-xs text-yellow-600">Receita</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-700">{(proposalReports.conversionRate * 100).toFixed(0)}%</p>
              <p className="text-xs text-purple-600">Conversão</p>
            </div>
          </div>
        )}

        {/* Create form */}
        <form onSubmit={proposalForm.handleSubmit(onProposalSubmit)} className="space-y-4 max-w-lg border p-4 rounded-lg">
          <h3 className="font-semibold text-sm">Nova Proposta</h3>
          <div className="space-y-2">
            <Label htmlFor="prop-title">Título</Label>
            <input id="prop-title" className={inputClass} placeholder="Ex: Proposta Site Institucional" {...proposalForm.register("title")} />
            {proposalForm.formState.errors.title && <p className="text-sm text-destructive">{proposalForm.formState.errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prop-client">Cliente</Label>
              <input id="prop-client" className={inputClass} placeholder="Nome" {...proposalForm.register("clientName")} />
              {proposalForm.formState.errors.clientName && <p className="text-sm text-destructive">{proposalForm.formState.errors.clientName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-email">Email</Label>
              <input id="prop-email" className={inputClass} placeholder="cliente@email.com" {...proposalForm.register("clientEmail")} />
              {proposalForm.formState.errors.clientEmail && <p className="text-sm text-destructive">{proposalForm.formState.errors.clientEmail.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prop-discount">Desconto (R$)</Label>
            <input id="prop-discount" type="number" min="0" step="0.01" className={inputClass} {...proposalForm.register("discount", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prop-notes">Observações</Label>
            <textarea id="prop-notes" className={inputClass} rows={2} {...proposalForm.register("notes")} />
          </div>

          {/* Items selector */}
          <div>
            <Label className="mb-2 block">Serviços</Label>
            <div className="flex gap-2 mb-2">
              <select
                className="flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base"
                onChange={(e) => {
                  if (e.target.value) {
                    addProposalItem(Number(e.target.value));
                    e.target.value = "";
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Adicionar serviço...</option>
                {availableServices.map((s) => (
                  <option key={s.id} value={s.id}>{s.title} — R$ {s.price.toFixed(2)}</option>
                ))}
              </select>
            </div>
            {proposalItems.length > 0 && (
              <div className="space-y-1 mb-2">
                {proposalItems.map((item, idx) => {
                  const svc = availableServices.find((s) => s.id === item.serviceId);
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg">
                      <span className="text-sm flex-1">{svc?.title || `Serviço #${item.serviceId}`}</span>
                      <input
                        type="number"
                        min={1}
                        className="h-7 w-16 rounded border border-input bg-transparent px-1.5 text-sm"
                        value={item.quantity}
                        onChange={(e) => updateProposalItemQuantity(idx, Number(e.target.value))}
                      />
                      <span className="text-xs text-muted-foreground w-20 text-right">R$ {((svc?.price || 0) * item.quantity).toFixed(2)}</span>
                      <Button size="xs" variant="destructive" type="button" onClick={() => removeProposalItem(idx)}>X</Button>
                    </div>
                  );
                })}
              </div>
            )}
            {proposalItems.length > 0 && (
              <p className="text-sm font-semibold">Total: R$ {calcProposalTotal().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            )}
          </div>

          <Button type="submit" disabled={proposalForm.formState.isSubmitting || proposalItems.length === 0}>
            Criar Proposta
          </Button>
        </form>

        {/* Proposals list */}
        {proposals.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-600">Propostas ({proposals.length})</h3>
            {proposals.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{p.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === "draft" ? "bg-gray-200 text-gray-700" :
                      p.status === "sent" ? "bg-blue-200 text-blue-700" :
                      p.status === "accepted" ? "bg-green-200 text-green-700" :
                      p.status === "rejected" ? "bg-red-200 text-red-700" :
                      "bg-yellow-200 text-yellow-700"
                    }`}>{p.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {p.clientName} — R$ {p.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="xs" variant="outline" onClick={() => viewProposal(p.id)}>Ver</Button>
                  {p.status === "draft" && (
                    <Button size="xs" variant="default" onClick={() => transitionProposal(p.id, "sent")}>Enviar</Button>
                  )}
                  {p.status === "sent" && (
                    <>
                      <Button size="xs" variant="default" onClick={() => transitionProposal(p.id, "accepted")}>Aceitar</Button>
                      <Button size="xs" variant="destructive" onClick={() => transitionProposal(p.id, "rejected")}>Recusar</Button>
                    </>
                  )}
                  <Button size="xs" variant="destructive" onClick={() => deleteProposal(p.id)}>Excluir</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
)}
```

- [ ] **Step 6: Update the `init` useEffect dependency array**

Find the init `useEffect((...) => { ... init(); })` and update the dependency array:
```tsx
}, [fetchUser, fetchServices, fetchContacts, fetchProjects, fetchTestimonials, fetchProposals, fetchProposalReports, fetchAvailableServices]);
```

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/dashboard-content.tsx
git commit -m "feat: add proposals (orçamentos) tab to dashboard with reports and state management"
```

---

### Task 14: Update RELATORIO.md

**Files:**
- Modify: `RELATORIO.md`

- [ ] **Step 1: Update sections**

Add the following new sections after section 10:

```markdown
## 11. Melhorias Implementadas (Feedback)

### 11.1. Tratamento Centralizado de Erros

- Classes de erro hierárquicas em `server/src/lib/errors.ts`: `AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `RateLimitError`
- Plugin global `server/src/plugins/error-handler.ts` registra `setErrorHandler` no Fastify
- Todas as rotas e serviços lançam erros tipados em vez de `reply.code().send()` inline

### 11.2. Rate Limiting no Login

- Plugin `server/src/plugins/rate-limit.ts`
- Limite de 5 tentativas por IP em janela de 15 minutos
- Armazenamento em memória (Map)
- Retorna HTTP 429 quando excedido

### 11.3. Controle de Autorização (RBAC)

- Campo `role` adicionado ao modelo `User` (`admin` | `user`, default `user`)
- Role incluída no payload JWT
- Middleware `requireAdmin` adicionado ao plugin de auth
- Regras:
  - `GET/POST/DELETE /api/users` → apenas admin
  - `PUT /api/users/:id` → próprio usuário OU admin
  - Todos os writes (services, contacts, projects, testimonials, proposals) → apenas admin

### 11.4. Paginação, Ordenação e Filtros

- Helper `server/src/lib/pagination.ts` com parâmetros padronizados
- Todos os endpoints de listagem aceitam `?page`, `limit`, `sort`, `order`, `search`
- Resposta padronizada: `{ data, total, page, limit, totalPages }`

### 11.5. Normalização de Email

- Emails normalizados (trim + lowercase) ao salvar contatos e propostas
```

Then add:

```markdown
## 12. Módulo de Orçamentos e Propostas Comerciais

### 12.1. Modelos

| Modelo | Descrição |
|--------|-----------|
| **Proposal** | Proposta comercial com título, cliente, subtotal, desconto, total, status |
| **ProposalItem** | Itens da proposta (serviço, quantidade, preço unitário, subtotal) |
| **ProposalHistory** | Histórico de alterações (campo, valor antigo, valor novo, usuário) |

### 12.2. Máquina de Estados

```
draft → sent → accepted
             → rejected
             → expired (automático, 7 dias)
```

### 12.3. Regras de Negócio

- Preços calculados exclusivamente no servidor (unitPrice lido do Service.price)
- Subtotal e total recalculados automaticamente a cada alteração
- Desconto validado (0 ≤ desconto ≤ subtotal)
- Propostas em rascunho são editáveis; após envio, itens e desconto são bloqueados
- Transições de status validadas (ex: não pode pular de draft para accepted)
- Histórico registra toda mudança de status e alteração de itens

### 12.4. Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/proposals | Listar (paginado, filtrável por status) |
| GET | /api/proposals/:id | Detalhes + itens + histórico |
| POST | /api/proposals | Criar proposta com itens |
| PUT | /api/proposals/:id | Editar rascunho |
| PATCH | /api/proposals/:id/status | Transição de status |
| DELETE | /api/proposals/:id | Excluir proposta |
| POST | /api/proposals/:id/items | Adicionar item |
| PUT | /api/proposals/:id/items/:itemId | Atualizar quantidade |
| DELETE | /api/proposals/:id/items/:itemId | Remover item |
| GET | /api/proposals/reports | Relatórios gerenciais |

### 12.5. Expiração Automática

Rotina executada a cada 60 segundos no servidor: propostas com status `sent` e mais de 7 dias sem atualização são marcadas como `expired`.

### 12.6. Frontend

Nova aba "Orçamentos" no dashboard com:
- Relatórios gerenciais (total de propostas, aceitas, receita, taxa de conversão)
- Formulário de criação com seleção múltipla de serviços
- Cálculo de total em tempo real
- Lista de propostas com badges de status coloridos
- Ações contextuais por status (Enviar, Aceitar, Recusar, Ver detalhes)
- Visualização detalhada com itens, valores e histórico de alterações
```

Update the endpoint table in section 4 to include the new proposals endpoints.

Update the models table in section 3 to include Proposal, ProposalItem, ProposalHistory, and the new `price` and `role` fields.

Update the project structure diagram in section 2 to include the new files.

- [ ] **Step 2: Commit**

```bash
git add RELATORIO.md
git commit -m "docs: update RELATORIO.md with improvements and proposal module"
```

---

### Task 15: Final Verification

- [ ] **Step 1: Start backend and test**

```bash
cd server && npm run dev
```

Expected: server starts on port 3001 with no errors.

- [ ] **Step 2: Start frontend and test**

```bash
npm run dev
```

Expected: Next.js starts on port 3000.

- [ ] **Step 3: Manual smoke test**

- Login with admin/admin123
- Navigate to dashboard → Orçamentos tab
- Create a proposal with at least one service
- Verify status transitions
- Check that public pages still work with paginated responses

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final verification adjustments"
```
