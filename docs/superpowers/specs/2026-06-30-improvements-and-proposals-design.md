# Design Spec: Improvements + Proposal Module

**Date:** 2026-06-30  
**Status:** Approved  
**Project:** Unobtainium (CC6PDSW)

---

## Part 1 — Five Improvement Points

### 1.1 Centralized Error Handling

**Goal:** Replace ad-hoc `reply.code().send()` patterns with a class-based error hierarchy caught by a global Fastify error handler.

**New file: `server/src/lib/errors.ts`**

| Error Class | HTTP Status | Use Case |
|---|---|---|
| `AppError` (base) | 500 | Generic application error |
| `ValidationError` | 400 | Zod failures, missing required fields, invalid input |
| `NotFoundError` | 404 | Entity not found by ID |
| `UnauthorizedError` | 401 | Missing or invalid JWT |
| `ForbiddenError` | 403 | Authenticated user lacks permission (role) |
| `RateLimitError` | 429 | Too many login attempts |

All classes extend `AppError`. Constructor: `(message: string, statusCode?: number)`.

**New file: `server/src/plugins/error-handler.ts`**

- Registers `app.setErrorHandler()` in Fastify
- If error is `AppError` subclass → respond with `{ error: ClassName, message, statusCode }`
- If unexpected → log full error, respond 500 `{ error: "InternalError", message: "Erro interno do servidor", statusCode: 500 }`
- Registered in `app.ts`

**Services** throw errors instead of returning raw results. Routes remove inline error handling; errors bubble to the global handler.

### 1.2 Login Rate Limiting

**New file: `server/src/plugins/rate-limit.ts`**

- In-memory `Map<string, { count: number, firstAttempt: number }>`
- Key: request IP
- Window: 15 minutes
- Max attempts: 5
- Applied only to `POST /api/auth/login` via `preHandler`
- On failure (non-200 response), increment counter via `onSend` hook
- On success (200), clear the counter for that IP
- Returns `RateLimitError` (429) when limit exceeded
- Resets on server restart (acceptable for this project)

### 1.3 Authorization (Role-Based)

**Schema change:** Add `role String @default("user")` to `User` model.  
**Pragma migration:** Add to `schema.prisma`, run `npx prisma migrate dev --name add-user-role`.

**JWT payload:** Include `role` alongside `userId` and `username`.

**New middleware: `requireAdmin`** in `server/src/plugins/auth.ts`
- Checks `request.user.role === "admin"`
- Throws `ForbiddenError` if not

**Permission rules:**
| Operation | Access |
|---|---|
| `GET /api/users` | Admin only |
| `POST /api/users` | Admin only |
| `PUT /api/users/:id` | Self (user edits own profile) OR admin |
| `DELETE /api/users/:id` | Admin only |
| All write ops on services, contacts, projects, testimonials | Admin only |
| Public reads | No auth |

**Seed update:** Admin user gets `role: "admin"`.

### 1.4 Pagination & Sorting

**New file: `server/src/lib/pagination.ts`**

Shared helper that extracts and validates query params:

```
GET /api/entities?page=1&limit=20&sort=createdAt&order=desc&search=term
```

| Param | Default | Validation |
|---|---|---|
| `page` | 1 | Integer >= 1 |
| `limit` | 20 | Integer 1..100 |
| `sort` | `createdAt` | Whitelist per module |
| `order` | `desc` | `asc` or `desc` |
| `search` | (none) | String, trims |

Returns `{ skip, take, orderBy, where }` for Prisma query construction.

**Response shape:**
```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

Updated modules: users, services, contacts, projects, testimonials, proposals.

### 1.5 Email Normalization

In `ContactService.create()` and `ProposalService.create()`: trim whitespace, lowercase email before Prisma write. Minimal change.

---

## Part 2 — Proposal Module (Orçamentos e Propostas)

### 2.1 Data Model

**`Proposal` model:**
| Field | Type | Notes |
|---|---|---|
| `id` | Int PK autoincrement | |
| `title` | String | |
| `clientName` | String | |
| `clientEmail` | String | Normalized before save |
| `subtotal` | Float | Sum of ProposalItem subtotals (server-calculated) |
| `discount` | Float @default(0) | Must be 0..subtotal |
| `total` | Float | subtotal - discount (server-calculated) |
| `status` | String @default("draft") | draft, sent, accepted, rejected, expired |
| `notes` | String? | Optional internal notes |
| `createdAt` | DateTime @default(now()) | |
| `updatedAt` | DateTime @updatedAt | |

**`ProposalItem` model:**
| Field | Type | Notes |
|---|---|---|
| `id` | Int PK autoincrement | |
| `proposalId` | Int FK → Proposal (cascade) | |
| `serviceId` | Int FK → Service | |
| `quantity` | Int @default(1) | >= 1 |
| `unitPrice` | Float | Snapshot from Service.price at creation |
| `subtotal` | Float | quantity * unitPrice |
| `createdAt` | DateTime @default(now()) | |

**`ProposalHistory` model:**
| Field | Type | Notes |
|---|---|---|
| `id` | Int PK autoincrement | |
| `proposalId` | Int FK → Proposal (cascade) | |
| `userId` | Int FK → User | Who made the change |
| `field` | String | Name of changed field |
| `oldValue` | String? | Previous value (null if creation) |
| `newValue` | String | New value |
| `createdAt` | DateTime @default(now()) | |

**`Service` model addition:** Add `price Float @default(0)`.

### 2.2 State Machine

```
    ┌─────────┐
    │  draft  │ ← editable (items, discount, title, client info)
    └────┬────┘
         │ send
    ┌────▼────┐
    │   sent  │ ← read-only (items/discount locked)
    └──┬──┬───┘
       │  │
  ┌────┘  └──────┐
  ▼              ▼
┌───────┐   ┌──────────┐    ┌──────────┐
│accepted│   │ rejected │    │ expired  │ ← terminal states
└───────┘   └──────────┘    └──────────┘
```

Valid transitions:
- `draft` → `sent`
- `sent` → `accepted`
- `sent` → `rejected`
- `sent` → `expired` (auto-cron only)
- `expired` → `draft` (reopen, optional)
- No other transitions allowed

### 2.3 Business Rules

1. **Server-side calculation:** `unitPrice` is read from `Service.price` at item creation. `subtotal = quantity * unitPrice`. Proposal `subtotal = sum(item subtotals)`. `total = subtotal - discount`. Client sends only `serviceId` and `quantity`.

2. **Discount validation:** 0 <= discount <= subtotal.

3. **Item validation:** `serviceId` must exist. `quantity >= 1`.

4. **Draft mutability:** Draft proposals can have items added/removed, discount changed, title/client info changed.

5. **Sent immutability:** Once status != draft, items and discount are locked. Only status transitions allowed.

6. **History tracking:** Every status change, discount change, and item add/remove logs to `ProposalHistory` with userId.

7. **Auto-expiry:** Proposals with `status = "sent"` and `updatedAt < 7 days ago` are marked `expired` by a periodic check.

### 2.4 API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/proposals` | Admin | List all (paginated). Optional query `?status=sent` |
| `GET` | `/api/proposals/:id` | Admin | Detail + items + history |
| `POST` | `/api/proposals` | Admin | Create: `{ title, clientName, clientEmail, items: [{ serviceId, quantity }], discount?, notes? }` |
| `PUT` | `/api/proposals/:id` | Admin | Update draft fields (title, client*). Items managed via separate item routes. |
| `PATCH` | `/api/proposals/:id/status` | Admin | Body: `{ status: "sent" | "accepted" | "rejected" }` |
| `POST` | `/api/proposals/:id/items` | Admin | Add item to draft: `{ serviceId, quantity }` |
| `PUT` | `/api/proposals/:id/items/:itemId` | Admin | Update item quantity in draft |
| `DELETE` | `/api/proposals/:id/items/:itemId` | Admin | Remove item from draft |
| `GET` | `/api/proposals/reports` | Admin | Aggregated stats |

**Reports endpoint response:**
```json
{
  "totalProposals": 15,
  "byStatus": { "draft": 3, "sent": 5, "accepted": 4, "rejected": 2, "expired": 1 },
  "totalRevenue": 45000.0,
  "conversionRate": 0.33
}
```

**Note on status transition:** Since proposal items and discounts are locked after draft, the `PUT /api/proposals/:id` for non-draft proposals only allows status transitions (delegates to same logic as `PATCH`).

### 2.5 Auto-Expiry Cron

In `server/src/server.ts`, after `listen()`:
```ts
setInterval(async () => {
  try {
    const { ProposalService } = await import("./modules/proposals/proposal.service");
    await ProposalService.expireOverdue();
  } catch (e) {
    // log and continue
  }
}, 60_000);
```

Expiry rule: `WHERE status = "sent" AND updatedAt < NOW() - 7 days`.

### 2.6 Frontend

**Dashboard tab "Orçamentos":**
- List view with status badges (color-coded), search/filter by status
- Create modal: title, client name/email, service multi-select with quantity
- Edit draft: modify items, discount, details
- Action buttons: Enviar, Aceitar, Recusar (context-sensitive by status)
- Reports sub-section: summary cards (counts, revenue, conversion)

**Components used:** Existing shadcn UI components (Card, Button, Input, Label).

### 2.7 Module Structure

Following existing pattern:
```
server/src/modules/proposals/
├── proposal.schema.ts   → Zod schemas (create, update, addItem, statusTransition)
├── proposal.service.ts  → Business logic + Prisma queries
└── proposal.routes.ts    → HTTP handlers
```

---

## Part 3 — RELATORIO.md Update

Update `RELATORIO.md` with:
- Section on improvements (error handling, rate limiting, authorization, pagination, email normalization)
- Section on proposal module (model, API, business rules, state machine)
- Updated tech table, updated endpoint table

---

## Implementation Order

1. Error handling (`errors.ts` + plugin) — foundation for clean error responses
2. Authorization (`role` field, JWT update, `requireAdmin` middleware)
3. Rate limiting (`rate-limit.ts` plugin)
4. Pagination (`pagination.ts` helper + update all list routes)
5. Email normalization (minimal change)
6. Service model: add `price` field
7. Proposal module: schema → service → routes (proposals + items + history)
8. Proposal auto-expiry cron
9. Frontend: dashboard orçamentos tab + reports
10. Update RELATORIO.md
