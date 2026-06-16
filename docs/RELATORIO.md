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
│   │   │   └── dashboard-content.tsx  # Client component (5 abas de gestão)
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
│       ├── lib/prisma.ts         # Singleton PrismaClient
│       ├── plugins/
│       │   ├── cors.ts           # Plugin CORS (origin: localhost:3000)
│       │   └── auth.ts           # Middleware JWT + função signToken
│       └── modules/
│           ├── auth/             # Login, me, logout
│           ├── users/            # CRUD de usuários
│           ├── services/         # CRUD de serviços
│           ├── contacts/         # CRUD de contatos
│           ├── projects/         # CRUD de projetos
│           └── testimonials/     # CRUD de depoimentos
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
| **User**    | id, username (unique), password (hash), name, createdAt                | Autenticação do sistema     |
| **Service** | id, title, description, createdAt, updatedAt                           | Serviços da agência         |
| **Contact** | id, name, email, message, createdAt                                    | Mensagens do formulário     |
| **Project** | id, title, description, imageUrl, createdAt, updatedAt                 | Portfólio de projetos       |
| **Testimonial** | id, name, role, text, createdAt                                     | Depoimentos de clientes     |

### Seed

Arquivo: `server/prisma/seed.ts`

- 1 usuário admin (`admin` / `admin123`)
- 3 serviços (Desenvolvimento Web, Design UI/UX, Auditoria de Código)
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
| Método | Rota             | Descrição         |
|--------|------------------|-------------------|
| GET    | /api/users       | Listar usuários   |
| POST   | /api/users       | Criar usuário     |
| PUT    | /api/users/:id   | Atualizar usuário |
| DELETE | /api/users/:id   | Remover usuário   |

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
| GET    | /api/testimonials      | Listar depoimentos     |
| POST   | /api/testimonials      | Criar (protegido)      |
| PUT    | /api/testimonials/:id  | Atualizar (protegido)  |
| DELETE | /api/testimonials/:id  | Remover (protegido)    |

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
- **`plugins/auth.ts`**: Middleware `authMiddleware` que verifica JWT do cookie `auth-token` e injeta `request.user`. Função `signToken` gera JWT com expiração de 24h.

### Fluxo de Autenticação

1. Cliente envia `{ username, password }` → `POST /api/auth/login`
2. Servidor valida com Zod, busca usuário no banco, compara hash bcrypt
3. Se válido, gera JWT (`{ userId, username }`) e retorna em cookie `auth-token` (httpOnly, maxAge 86400)
4. Rotas protegidas usam `preHandler: authMiddleware` que verifica e decodifica o JWT
5. Logout: limpa o cookie

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
**dashboard-content.tsx:** Client Component com 5 abas de gestão

| Aba         | Funcionalidade                                            |
|-------------|----------------------------------------------------------|
| Perfil      | Editar nome e senha do usuário logado (React Hook Form)  |
| Serviços    | CRUD completo: criar, editar, excluir serviços           |
| Contatos    | Inbox de mensagens recebidas do formulário público       |
| Projetos    | CRUD completo: criar, editar, excluir projetos           |
| Depoimentos | CRUD completo: criar, editar, excluir depoimentos        |

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
