# Stride

Gerenciador de agenda pessoal com visualizações diária, semanal e mensal, suporte a tarefas recorrentes e assistente de IA integrado.

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Tests](https://img.shields.io/badge/testes-52%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage%20(domain%2Fuse--cases)-97%25-brightgreen)

---

## Screenshots

> Visão diária com gráfico de distribuição de horas por categoria

![Daily View](docs/screenshots/daily.png)

> Visão mensal com dots de prioridade por dia

![Monthly View](docs/screenshots/monthly.png)

> Assistente de IA com streaming de resposta

![AI Assistant](docs/screenshots/ai.png)

---

## Funcionalidades

- **Visualizações** — Diária, Semanal e Mensal com navegação entre períodos
- **Tarefas** — Criação com título, descrição, categoria, prioridade, duração (horas + minutos) e horário agendado
- **Tarefas recorrentes** — Selecione os dias da semana; instâncias são geradas automaticamente para os próximos 28 dias
- **Timeline do dia** — Gráfico de rosca SVG mostrando como as horas estão distribuídas por categoria
- **Progresso** — Barra de checklist indicando tarefas concluídas no período
- **Stride AI** — Assistente integrado via Groq que analisa sua agenda, sugere reordenação de tarefas e responde perguntas em chat com streaming
- **Tema claro/escuro**

---

## Requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- npm v9 ou superior (incluído com o Node)
- Conta no [Groq Console](https://console.groq.com) para obter uma API Key gratuita

---

## Instalação e execução

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/stride.git
cd stride
```

### 2. Instale as dependências

```bash
npm install
```

Isso instala as dependências de todos os workspaces (`backend` e `frontend`) de uma vez.

### 3. Configure as variáveis de ambiente do backend

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` e preencha:

```env
DATABASE_URL="file:./prisma/dev.db"
GROQ_API_KEY="gsk_sua_chave_aqui"
GROQ_MODEL="llama-3.1-8b-instant"
PORT=3001
```

> A chave Groq é gratuita em [console.groq.com](https://console.groq.com). O modelo padrão `llama-3.1-8b-instant` é rápido e suficiente para as funcionalidades de IA.

### 4. Crie o banco de dados

```bash
cd backend
npx prisma db push
cd ..
```

Isso cria o arquivo SQLite `backend/prisma/dev.db` com o schema completo.

### 5. Inicie a aplicação

```bash
npm run dev
```

Sobe o backend e o frontend simultaneamente:

| Serviço  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:5173     |
| Backend  | http://localhost:3001     |
| Health   | http://localhost:3001/health |

---

## Scripts disponíveis

Na raiz do projeto:

| Comando           | Descrição                                      |
|-------------------|------------------------------------------------|
| `npm run dev`     | Inicia backend e frontend em modo desenvolvimento |
| `npm run build`   | Build de produção dos dois workspaces          |
| `npm run test`    | Roda os testes do backend                      |
| `npm run test:all`| Roda os testes de todos os workspaces          |

Dentro de `backend/`:

| Comando                  | Descrição                              |
|--------------------------|----------------------------------------|
| `npm run db:studio`      | Abre o Prisma Studio (GUI do banco)    |
| `npm run db:push --force-reset` | Reseta o banco (apaga todos os dados) |

---

## Deploy

### Frontend — Vercel (recomendado)

1. Importe o repositório no [vercel.com](https://vercel.com)
2. Configure o **Root Directory** como `frontend`
3. Adicione a variável de ambiente:
   ```
   VITE_API_URL=https://sua-api.railway.app
   ```
4. Deploy automático a cada push na `main`

### Backend — Railway

1. Crie um novo projeto no [railway.app](https://railway.app) e conecte o repositório
2. Configure o **Root Directory** como `backend`
3. Adicione as variáveis de ambiente:
   ```
   DATABASE_URL=file:./prisma/dev.db
   GROQ_API_KEY=gsk_...
   GROQ_MODEL=llama-3.1-8b-instant
   PORT=3001
   ```
4. Adicione o comando de start: `npm run db:push && npm start`

> **Nota sobre SQLite em produção:** o SQLite é persistido no disco do container. Para ambientes com redeploys frequentes, considere migrar para PostgreSQL alterando o `provider` no `schema.prisma` e ajustando o `DATABASE_URL`.

---

## Arquitetura

O projeto é um **monorepo npm workspaces** com dois pacotes independentes.

```
stride/
├── backend/          # API REST — Node.js + Express + TypeScript
└── frontend/         # SPA — React + Vite + TypeScript
```

### Backend — Clean Architecture

O backend é organizado em quatro camadas com dependências de dentro para fora:

```
backend/src/
├── domain/
│   ├── entities/       # Task — regras de negócio puras, sem dependências externas
│   └── repositories/   # ITaskRepository — interface (contrato), não implementação
│
├── application/
│   ├── use-cases/      # Um arquivo por caso de uso:
│   │                   #   CreateTask, UpdateTask, DeleteTask, CompleteTask,
│   │                   #   GetTasksByPeriod, GenerateRecurringInstances
│   └── services/       # IAIAssistantService — interface do serviço de IA
│
├── infrastructure/
│   ├── database/       # PrismaTaskRepository — implementa ITaskRepository via SQLite
│   └── ai/             # GroqAIService — implementa IAIAssistantService via API Groq
│
└── api/
    ├── routes/         # tasks.ts, ai.ts — Express Router, sem lógica de negócio
    ├── schemas/        # taskSchemas.ts — validação de entrada com Zod
    └── server.ts       # ponto de entrada; monta Express + injeta dependências
```

**Princípio central:** a camada `domain` não conhece nada além de si mesma. Os casos de uso dependem apenas de interfaces (`ITaskRepository`), nunca de Prisma diretamente — a implementação concreta é injetada no `server.ts`. Isso torna o código testável sem banco de dados real.

**Tarefas recorrentes:** ao criar uma tarefa com `isRecurring: true`, o caso de uso `GenerateRecurringInstances` gera automaticamente instâncias individuais para os próximos 28 dias com base nos dias da semana selecionados. Cada instância é uma tarefa normal (`isRecurring: false`) com `recurringParentId` apontando para o template. Ao editar ou excluir o template, as instâncias pendentes são regeneradas ou removidas em cascata.

**Tratamento de fuso horário:** as consultas por período usam limites UTC calculados no frontend (com `date-fns`), não no servidor. Isso evita que tarefas noturnas (ex: dormir às 22h) apareçam no dia errado por diferença de fuso.

### Frontend — React SPA

```
frontend/src/
├── pages/
│   ├── DailyView.tsx    # Visualização do dia com timeline de horas
│   ├── WeeklyView.tsx   # Visualização semanal com agrupamento por dia ou categoria
│   └── MonthlyView.tsx  # Grade mensal com dots de prioridade por dia
│
├── components/
│   ├── TaskForm.tsx         # Modal de criação/edição (renderizado via React Portal)
│   ├── TaskCard.tsx         # Card de tarefa com ações (completar, iniciar, pular, editar)
│   ├── DayTimeline.tsx      # Gráfico de rosca SVG — distribuição de horas por categoria
│   ├── ChecklistProgress.tsx# Barra de progresso do período
│   └── AIAssistant.tsx      # Painel lateral de chat com a IA (streaming SSE)
│
├── hooks/
│   └── useTasks.ts      # React Query — busca, criação, edição, exclusão de tarefas
│
├── services/
│   └── api.ts           # Wrapper de fetch para a API REST
│
└── types/
    └── task.ts          # Tipos TypeScript compartilhados (Task, enums, payloads)
```

**Gerenciamento de estado:** não há store global (Redux, Zustand etc.). Todo estado de servidor vive no React Query (`useQuery` / `useMutation`). Estado local de UI (modal aberto, dia selecionado) vive em `useState` no componente que o usa.

**Modais:** o `TaskForm` usa `ReactDOM.createPortal` para renderizar no `document.body`, evitando problemas de clipping com contêineres `overflow: hidden`.

### Banco de dados

SQLite gerenciado pelo Prisma. Um único modelo `Task` armazena tanto templates recorrentes quanto instâncias regulares, diferenciados pelo campo `isRecurring` e `recurringParentId`.

```
Task {
  id, title, description
  period          // daily | weekly | monthly
  priority        // low | medium | high | urgent
  category        // work | personal | health | leisure | household | food | hygiene | other
  status          // pending | in_progress | completed | overdue | skipped
  timeLimitMinutes
  scheduledAt     // horário de início (opcional)
  dueDate         // calculado: scheduledAt + timeLimitMinutes
  isRecurring     // true = template; false = instância ou tarefa avulsa
  recurringConfig // JSON: { frequency, daysOfWeek }
  recurringParentId
  tags            // JSON array
}
```

### Stack resumida

| Camada      | Tecnologia                                              |
|-------------|---------------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, TailwindCSS, React Query, date-fns, React Router 6 |
| Backend     | Node.js, Express, TypeScript, Zod                       |
| Banco       | SQLite via Prisma 5                                     |
| IA          | Groq API — modelo `llama-3.1-8b-instant`               |
| Testes      | Vitest, Testing Library                                 |
| Monorepo    | npm workspaces + concurrently                           |
