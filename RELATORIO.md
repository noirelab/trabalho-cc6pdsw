# Relatório Técnico — Unobtainium (Backend + Frontend)

**Trabalho CC6PDSW** | Junho 2026

---

## 1. Visão Geral

Sistema web full-stack para a agência fictícia **Unobtainium**, composto por:

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui + React Hook Form + Zod
- **Backend:** Fastify + Prisma ORM + SQLite + JWT + bcrypt + Zod
- **Arquitetura:** Backend em camadas (routes → service → Prisma), frontend com server/client components

---

## 2. Estrutura do Projeto

```
/home/noirelab/trabalho-cc6pdsw/
├── src/                          # Frontend Next.js
│   ├── app/
│   │   ├── layout.tsx            # Layout raiz (navbar + footer)
│   │   ├── page.tsx              # Home page (hero + depoimentos)
│   │   ├── globals.css           # Estilos globais Tailwind
│   │   ├── about/page.tsx        # Página Sobre
│   │   ├── contact/page.tsx      # Formulário de contato público
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Server component (verifica auth)
│   │   │   └── dashboard-content.tsx  # Client component (6 abas de gestão)
│   │   ├── login/
│   │   │   ├── page.tsx          # Login com React Hook Form + Zod
│   │   │   └── actions.ts        # Server action de logout
│   │   ├── projects/page.tsx     # Galeria de portfólio
│   │   ├── services/
│   │   │   ├── page.tsx          # Lista de serviços (fetch da API)
│   │   │   └── [id]/page.tsx     # Detalhes do serviço
│   ├── components/ui/            # Componentes shadcn (Button, Card, Input, Label)
│   ├── lib/utils.ts              # Função cn() para classes Tailwind
│   └── middleware.ts             # Middleware Next.js (protege /dashboard)
│
├── server/                       # Backend Fastify
│   ├── package.json              # Dependências do servidor
│   ├── tsconfig.json             # Config TypeScript
│   ├── .env                      # Variáveis de ambiente
│   ├── prisma/
│   │   ├── schema.prisma         # Modelos do banco (5 entidades)
│   │   ├── seed.ts               # Dados iniciais
│   │   └── dev.db                # Banco SQLite
│   └── src/
│       ├── server.ts             # Bootstrap (listen na porta 3001)
│       ├── app.ts                # Factory Fastify (plugins + rotas)
│       ├── lib/                     # Utilitários (Prisma singleton, classes de erro, paginação)
│       ├── plugins/
│       │   ├── cors.ts               # CORS
│       │   ├── auth.ts               # JWT + middleware de autenticação + requireAdmin
│       │   ├── error-handler.ts      # Tratamento global de erros
│       │   └── rate-limit.ts         # Rate limiting de login
│       └── modules/
│           ├── auth/                 # Login, me, logout
│           ├── users/                # CRUD de usuários
│           ├── services/             # CRUD de serviços
│           ├── contacts/             # CRUD de contatos
│           ├── projects/             # CRUD de projetos
│           ├── testimonials/         # CRUD de depoimentos
│           └── proposals/            # CRUD de propostas/orçamentos
│
├── docs/superpowers/specs/       # Documentos de design
└── package.json                  # Dependências do frontend
```

---

## 3. Banco de Dados (Prisma + SQLite)

Arquivo: `server/prisma/schema.prisma`

### Modelos

| Modelo      | Campos                                                                 | Propósito                   |
|-------------|------------------------------------------------------------------------|-----------------------------|
| **User**    | id, username (unique), password (hash), role, name, createdAt          | Autenticação e autorização  |
| **Service** | id, title, description, price, createdAt, updatedAt                    | Serviços da agência         |
| **Contact** | id, name, email, message, createdAt                                    | Mensagens do formulário     |
| **Project** | id, title, description, imageUrl, createdAt, updatedAt                 | Portfólio de projetos       |
| **Testimonial** | id, name, role, text, createdAt                                     | Depoimentos de clientes     |
| **Proposal** | id, title, clientName, clientEmail, subtotal, discount, total, status, notes, createdAt, updatedAt | Propostas comerciais |
| **ProposalItem** | id, proposalId, serviceId, quantity, unitPrice, subtotal, createdAt | Itens da proposta (serviços) |
| **ProposalHistory** | id, proposalId, userId, field, oldValue, newValue, createdAt | Histórico de alterações |

### Seed

Arquivo: `server/prisma/seed.ts`

- 1 usuário admin (`admin` / `admin123`, role `admin`)
- 3 serviços com preços (Desenvolvimento Web R$15.000, Design UI/UX R$8.000, Auditoria de Código R$5.000)
- 3 projetos (Portal Acme, E-commerce Natura, App FitTrack)
- 3 depoimentos (Maria Silva, João Santos, Ana Costa)

---

## 4. Backend — Endpoints da API

Base URL: `http://localhost:3001`

### Auth
| Método | Rota              | Auth | Descrição                              |
|--------|-------------------|------|----------------------------------------|
| POST   | /api/auth/login   | Não  | Login: recebe {username, password}, retorna JWT em cookie httpOnly |
| GET    | /api/auth/me      | Sim  | Retorna dados do usuário logado        |
| POST   | /api/auth/logout  | Sim  | Limpa cookie auth-token                |

### Users (protegido)
| Método | Rota             | Auth  | Descrição         |
|--------|------------------|-------|-------------------|
| GET    | /api/users       | Admin | Listar usuários   |
| POST   | /api/users       | Admin | Criar usuário     |
| PUT    | /api/users/:id   | Self ou Admin | Atualizar usuário |
| DELETE | /api/users/:id   | Admin | Remover usuário   |

### Services (leitura pública)
| Método | Rota                | Descrição           |
|--------|---------------------|---------------------|
| GET    | /api/services       | Listar serviços     |
| GET    | /api/services/:id   | Detalhes do serviço |
| POST   | /api/services       | Criar (protegido)   |
| PUT    | /api/services/:id   | Atualizar (protegido) |
| DELETE | /api/services/:id   | Remover (protegido)   |

### Contacts
| Método | Rota              | Auth | Descrição              |
|--------|-------------------|------|------------------------|
| POST   | /api/contacts     | Não  | Enviar mensagem (público) |
| GET    | /api/contacts     | Sim  | Listar mensagens       |
| DELETE | /api/contacts/:id | Sim  | Excluir mensagem       |

### Projects (leitura pública)
| Método | Rota                | Descrição           |
|--------|---------------------|---------------------|
| GET    | /api/projects       | Listar projetos     |
| POST   | /api/projects       | Criar (protegido)   |
| PUT    | /api/projects/:id   | Atualizar (protegido) |
| DELETE | /api/projects/:id   | Remover (protegido)   |

### Testimonials (leitura pública)
| Método | Rota                   | Descrição              |
|--------|------------------------|------------------------|
| GET    | /api/testimonials      | Listar depoimentos (paginado) |
| POST   | /api/testimonials      | Criar (protegido)      |
| PUT    | /api/testimonials/:id  | Atualizar (protegido)  |
| DELETE | /api/testimonials/:id  | Remover (protegido)    |

### Proposals (protegido, admin)
| Método | Rota                        | Auth  | Descrição                        |
|--------|-----------------------------|-------|----------------------------------|
| GET    | /api/proposals              | Admin | Listar (paginado, filtrável por status) |
| GET    | /api/proposals/reports      | Admin | Relatórios gerenciais            |
| GET    | /api/proposals/:id          | Admin | Detalhes + itens + histórico     |
| POST   | /api/proposals              | Admin | Criar proposta com itens         |
| PUT    | /api/proposals/:id          | Admin | Editar rascunho                  |
| PATCH  | /api/proposals/:id/status   | Admin | Transição de status              |
| DELETE | /api/proposals/:id          | Admin | Excluir proposta                 |
| POST   | /api/proposals/:id/items    | Admin | Adicionar item ao rascunho       |
| PUT    | /api/proposals/:id/items/:itemId | Admin | Atualizar quantidade         |
| DELETE | /api/proposals/:id/items/:itemId | Admin | Remover item                |

### Health
| Método | Rota         | Descrição       |
|--------|-------------|-----------------|
| GET    | /api/health | Status do servidor |

---

## 5. Arquitetura Backend (Camadas)

Cada módulo segue a mesma estrutura de 3 arquivos:

```
modules/<nome>/
├── <nome>.schema.ts   → Schemas Zod para validação de entrada
├── <nome>.service.ts  → Lógica de negócio (operações Prisma)
└── <nome>.routes.ts   → Handlers HTTP (parse, chama service, responde)
```

### Plugins

- **`plugins/cors.ts`**: Habilita CORS para `http://localhost:3000` com `credentials: true`
- **`plugins/auth.ts`**: Middleware `authMiddleware` que verifica JWT do cookie `auth-token` e injeta `request.user`. Middleware `requireAdmin` para controle de permissão. Função `signToken` gera JWT com expiração de 24h.
- **`plugins/error-handler.ts`**: Tratamento global de erros via `setErrorHandler`. Mapeia classes de erro (`AppError`, `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `RateLimitError`) para respostas JSON padronizadas.
- **`plugins/rate-limit.ts`**: Rate limiting no endpoint de login. 5 tentativas por IP em janela de 15 minutos. Retorna 429 quando excedido.

### Fluxo de Autenticação

1. Cliente envia `{ username, password }` → `POST /api/auth/login` (com rate limiting)
2. Servidor valida com Zod, busca usuário no banco, compara hash bcrypt
3. Se válido, gera JWT (`{ userId, username, role }`) e retorna em cookie `auth-token` (httpOnly, maxAge 86400)
4. Rotas protegidas usam `preHandler: authMiddleware` que verifica e decodifica o JWT
5. Rotas administrativas usam `preHandler: requireAdmin` adicionalmente
6. Logout: limpa o cookie

### Tratamento de Erros

Classes de erro hierárquicas em `lib/errors.ts`: `AppError` (base, 500), `ValidationError` (400), `NotFoundError` (404), `UnauthorizedError` (401), `ForbiddenError` (403), `RateLimitError` (429). Serviços lançam erros; o handler global captura e retorna `{ error, message, statusCode }` padronizado.

### Paginação

Helper `lib/pagination.ts` aplicado a todos os endpoints de listagem. Parâmetros: `?page=1&limit=20&sort=createdAt&order=desc&search=term`. Resposta: `{ data, total, page, limit, totalPages }`.

---

## 6. Frontend — Páginas

### 6.1. Layout (`src/app/layout.tsx`)

Navbar fixa com links: Home, Sobre, Serviços, Projetos, Contato + botões Dashboard e Entrar.

### 6.2. Home (`src/app/page.tsx`)

**Tipo:** Server Component (async)
**Funcionalidade:**
- Hero section com título, descrição e CTAs (Ver Serviços, Fazer Login)
- Seção de depoimentos buscada via `GET /api/testimonials`
- Exibe 3 cards com nome, cargo e texto de cada depoimento

### 6.3. Login (`src/app/login/page.tsx`)

**Tipo:** Client Component
**Tecnologias:** React Hook Form + Zod + fetch
**Funcionalidade:**
- Formulário com validação client-side (username obrigatório, senha obrigatória)
- Ao submeter, chama `POST /api/auth/login`
- Em caso de sucesso, redireciona para `/dashboard`
- Exibe erros de validação e erros da API

**Logout** (`src/app/login/actions.ts`):
- Server Action que chama `POST /api/auth/logout` e limpa o cookie local

### 6.4. Dashboard (`src/app/dashboard/`)

**page.tsx:** Server Component que verifica cookie e renderiza `DashboardContent`
**dashboard-content.tsx:** Client Component com 6 abas de gestão

| Aba         | Funcionalidade                                            |
|-------------|----------------------------------------------------------|
| Perfil      | Editar nome e senha do usuário logado (React Hook Form)  |
| Serviços    | CRUD completo: criar, editar, excluir serviços           |
| Contatos    | Inbox de mensagens recebidas do formulário público       |
| Projetos    | CRUD completo: criar, editar, excluir projetos           |
| Depoimentos | CRUD completo: criar, editar, excluir depoimentos        |
| Orçamentos  | Relatórios, CRUD de propostas, transições de status, itens |

Cada aba faz fetch dos dados ao carregar e atualiza em tempo real após operações.

### 6.5. Serviços (`src/app/services/`)

**page.tsx:** Server Component que busca `GET /api/services` e renderiza grid de cards.
Cada card tem botão "Saber mais" que linka para `/services/[id]`.

**[id]/page.tsx:** Server Component que busca `GET /api/services/:id` e exibe:
- Título, descrição completa, data de criação e última atualização
- Botão "Voltar para Serviços"
- Página 404 automática se serviço não encontrado

### 6.6. Projetos (`src/app/projects/page.tsx`)

**Tipo:** Server Component
**Funcionalidade:**
- Busca `GET /api/projects` e renderiza grid de cards com gradiente placeholder
- Cada card mostra título, descrição e data do projeto

### 6.7. Contato (`src/app/contact/page.tsx`)

**Tipo:** Client Component
**Tecnologias:** React Hook Form + Zod
**Funcionalidade:**
- Formulário com campos: nome, email, mensagem
- Validação client-side (nome obrigatório, email válido, mensagem obrigatória)
- Ao submeter, chama `POST /api/contacts`
- Tela de sucesso após envio com opção de enviar outra mensagem

### 6.8. Sobre (`src/app/about/page.tsx`)

Página estática com informações da empresa fictícia.

---

## 7. Middleware Next.js

Arquivo: `src/middleware.ts`

- Intercepta requisições para `/dashboard` e `/dashboard/:path*`
- Verifica existência do cookie `auth-token`
- Redireciona para `/login` se não autenticado

---

## 8. Tecnologias Utilizadas

### Frontend
| Pacote              | Versão   | Uso                              |
|---------------------|----------|----------------------------------|
| next                | 14.2.15  | Framework React                  |
| react               | 18.2.0   | UI                               |
| react-hook-form     | latest   | Gerenciamento de formulários     |
| @hookform/resolvers | latest   | Integração Zod + React Hook Form |
| zod                 | latest   | Validação de formulários         |
| @base-ui/react      | 1.5.0    | Componentes base (shadcn)        |
| tailwindcss         | 3.4.3    | Estilização                      |
| lucide-react        | 1.16.0   | Ícones                           |

### Backend
| Pacote           | Uso                                  |
|------------------|--------------------------------------|
| fastify          | Servidor HTTP                        |
| @fastify/cors    | CORS                                 |
| @fastify/cookie  | Manipulação de cookies               |
| @prisma/client   | ORM                                  |
| prisma           | Migrations + CLI                     |
| zod              | Validação de entrada                 |
| jsonwebtoken     | Geração e verificação de JWT         |
| bcryptjs         | Hash de senhas                       |
| dotenv           | Variáveis de ambiente                |
| tsx              | Execução TypeScript em dev           |

---

## 9. Como Executar

### Pré-requisitos
- Node.js 18+
- npm

### Backend (porta 3001)
```bash
cd server
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

### Frontend (porta 3000)
```bash
npm install
npm run dev
```

### Credenciais de Teste
- **Usuário:** admin
- **Senha:** admin123

---

## 10. Decisões Técnicas

1. **SQLite** como banco: elimina necessidade de servidor de banco, arquivo único, ideal para desenvolvimento
2. **Fastify** (não Express): melhor performance, schema validation nativo, plugin system
3. **Arquitetura em camadas**: cada módulo tem schema (Zod) → service (Prisma) → routes (Fastify), facilitando manutenção e testes
4. **JWT em cookie httpOnly**: mais seguro que localStorage, proteção contra XSS
5. **React Hook Form + Zod no frontend**: validação consistente com o backend, menos re-renders que controlled components
6. **Server Components Next.js**: páginas públicas (serviços, projetos) usam server components com fetch direto da API, reduzindo JavaScript no cliente
7. **Dashboard como Client Component**: necessário para interatividade (abas, formulários dinâmicos, CRUD em tempo real)
8. **CORS restrito**: apenas `localhost:3000` pode acessar a API com credenciais

---

## 11. Melhorias Implementadas (Feedback)

### 11.1. Tratamento Centralizado de Erros

- Classes de erro hierárquicas em `server/src/lib/errors.ts`: `AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `RateLimitError`
- Plugin global `server/src/plugins/error-handler.ts` registra `setErrorHandler` no Fastify
- Todas as rotas e serviços lançam erros tipados em vez de `reply.code().send()` inline

### 11.2. Rate Limiting no Login

- Plugin `server/src/plugins/rate-limit.ts`
- Limite de 5 tentativas por IP em janela de 15 minutos
- Armazenamento em memória (Map) com limpeza periódica
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

---

## 12. Módulo de Orçamentos e Propostas Comerciais

### 12.1. Modelos

| Modelo | Campos |
|--------|--------|
| **Proposal** | id, title, clientName, clientEmail, subtotal, discount, total, status, notes, createdAt, updatedAt |
| **ProposalItem** | id, proposalId, serviceId, quantity, unitPrice, subtotal, createdAt |
| **ProposalHistory** | id, proposalId, userId, field, oldValue, newValue, createdAt |

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
