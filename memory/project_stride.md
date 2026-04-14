---
name: Projeto Stride
description: Contexto arquitetural e stack do projeto Stride (organizador de tarefas com IA)
type: project
---

Stride é um app full-stack de organização de tarefas com IA (Claude).

**Stack:**
- Backend: Node.js + Express + TypeScript + Prisma + SQLite
- Frontend: React + Vite + TypeScript + TailwindCSS + TanStack Query
- IA: @anthropic-ai/sdk (claude-sonnet-4-6)
- Testes: Vitest (TDD) — 44 testes passando

**Arquitetura (Clean Architecture):**
- `backend/src/domain/` — entidades e interfaces (Task, ITaskRepository)
- `backend/src/application/` — use cases (CreateTask, CompleteTask, etc.)
- `backend/src/infrastructure/` — Prisma repo, ClaudeAIService
- `backend/src/api/` — Express routes, Zod schemas
- `frontend/src/` — React pages (Daily/Weekly/Monthly), components, hooks

**Para rodar:**
1. `cd backend && echo ANTHROPIC_API_KEY=sk-... >> .env`
2. `npm run dev` (na raiz roda ambos em paralelo)

**Why:** App para evitar procrastinação com tarefas diárias/semanais/mensais, checklist por tempo, e IA que lembra o usuário de refeições, higiene, lazer e afazeres domésticos.

**How to apply:** Ao expandir funcionalidades, manter a separação de camadas (domain → application → infrastructure → api).
