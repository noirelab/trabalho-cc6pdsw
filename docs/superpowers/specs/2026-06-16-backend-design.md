# Backend Fastify + Prisma + SQLite

## Contexto

Frontend Next.js da agência fictícia "Unobtainium" precisa de backend real. Atualmente login é mock (cookie hardcoded), serviços são array estático, dashboard não tem dados.

## Tecnologias

- **Node.js** + **TypeScript**
- **Fastify** — servidor HTTP
- **Prisma ORM** + **SQLite** — banco de dados
- **Zod** — validação de entrada
- **JWT** (jsonwebtoken) — autenticação
- **bcrypt** — hash de senhas

## Estrutura do Projeto

```
server/
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma
├── src/
│   ├── server.ts              # bootstrap (listen)
│   ├── app.ts                 # factory Fastify (plugins, rotas)
│   ├── plugins/
│   │   ├── cors.ts
│   │   └── auth.ts            # middleware de autenticação JWT
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts
│   │   ├── users/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.schema.ts
│   │   └── services/
│   │       ├── services.routes.ts
│   │       ├── services.service.ts
│   │       └── services.schema.ts
│   └── lib/
│       └── prisma.ts           # PrismaClient singleton
```

## Modelos Prisma

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
}

model Service {
  id          Int      @id @default(autoincrement())
  title       String
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Endpoints

### Auth (público, exceto /me)
| Método | Rota           | Descrição         |
|--------|----------------|-------------------|
| POST   | /api/auth/login | Login             |
| GET    | /api/auth/me   | Dados do usuário logado |
| POST   | /api/auth/logout| Logout            |

### Users (protegido)
| Método | Rota           | Descrição         |
|--------|----------------|-------------------|
| GET    | /api/users     | Listar usuários   |
| POST   | /api/users     | Criar usuário     |
| PUT    | /api/users/:id | Atualizar usuário |
| DELETE | /api/users/:id | Remover usuário   |

### Services (leitura pública, escrita protegida)
| Método | Rota              | Descrição         |
|--------|-------------------|-------------------|
| GET    | /api/services     | Listar serviços   |
| POST   | /api/services     | Criar serviço     |
| PUT    | /api/services/:id | Atualizar serviço |
| DELETE | /api/services/:id | Remover serviço   |

## Fluxo de Autenticação

1. Cliente envia `{ username, password }` para `POST /api/auth/login`
2. Servidor valida com Zod, busca usuário no SQLite, compara hash bcrypt
3. Se válido, gera JWT (exp: 24h) e retorna + seta cookie `auth-token`
4. Middleware `auth.ts` verifica JWT em rotas protegidas via hook `onRequest`
5. Logout: limpa cookie `auth-token`

## Mudanças no Frontend

- **Login**: React Hook Form + Zod validation cliente-side, fetch `POST /api/auth/login`
- **Serviços**: fetch `GET /api/services` no carregamento, substituir array hardcoded
- **Dashboard**: fetch `GET /api/auth/me` para mostrar dados reais do usuário
- **Middleware Next.js**: manter verificação do cookie `auth-token` (compatível)
