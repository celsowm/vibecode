# Sistema de Gestão de Condomínio

Monorepo com backend **NestJS + Prisma (SQLite)** e frontend **React + TypeScript + MUI** para gestão de um condomínio: moradores/unidades, financeiro, reservas de áreas comuns, avisos e chamados de manutenção.

## Stack

- **Backend**: NestJS, Prisma ORM, SQLite, JWT (autenticação por papel: `ADMIN`, `SINDICO`, `MORADOR`)
- **Frontend**: React, TypeScript, MUI, React Query, React Router
- **Monorepo**: npm workspaces (`server/`, `client/`)

## Funcionalidades

- Autenticação e controle de acesso por papel
- Cadastro de unidades e vínculo de moradores (proprietário/inquilino)
- Financeiro: taxas, geração de cobranças por unidade, pagamentos e relatório de inadimplência
- Reservas de áreas comuns com checagem de conflito de horário
- Mural de avisos e chamados de manutenção com comentários

## Pré-requisitos

- Node.js 20+
- npm

## Instalação

```bash
npm install
```

### Configuração do backend

```bash
cd server
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
```

O seed cria um usuário administrador padrão:

- **Login**: `admin`
- **Senha**: `admin`

### Configuração do frontend

Crie `client/.env` com:

```
VITE_API_URL=http://localhost:3000
```

## Rodando o projeto

Na raiz do monorepo:

```bash
npm run dev
```

Isso sobe o backend em `http://localhost:3000` e o frontend em `http://localhost:5173` simultaneamente.

## Scripts úteis

| Comando | Descrição |
|---|---|
| `npm run dev` | Sobe backend e frontend em modo desenvolvimento |
| `npm run build` | Build de produção de backend e frontend |
| `npm run prisma:migrate` | Roda as migrations do Prisma |
| `npm run prisma:seed` | Popula o banco com o usuário admin |

## Estrutura

```
server/   NestJS + Prisma + SQLite (API)
client/   React + TypeScript + MUI (SPA)
```
