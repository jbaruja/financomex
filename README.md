# Sistema Financeiro COMEX

Sistema de controle financeiro voltado para operações de comércio exterior.

## Objetivo

Centralizar o controle de depósitos de clientes, despesas por processo e saldos bancários, garantindo que nenhum processo seja finalizado sem a devida cobrança ao cliente.

## Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Backend/Database**: Supabase (PostgreSQL + Auth + Storage)
- **Roteamento**: React Router DOM
- **Deploy**: Vercel

## Pré-requisitos

- Node.js 18+ e npm
- Conta no Supabase (gratuito)

## Setup do Projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto (copie de `.env.example`):

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e adicione suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

Para obter essas credenciais:
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto (ou crie um novo)
3. Vá em Settings > API
4. Copie a "Project URL" e a "anon public" key

### 3. Rodar o projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## Estrutura de Pastas

```
src/
├── components/
│   ├── ui/           # Componentes reutilizáveis (shadcn/ui)
│   └── layout/       # Header, Sidebar, etc
├── pages/
│   ├── auth/         # Login, Register
│   ├── dashboard/    # Dashboard principal
│   ├── clients/      # Gestão de clientes
│   ├── processes/    # Gestão de processos
│   ├── financial/    # Depósitos e Despesas
│   ├── reports/      # Relatórios
│   └── settings/     # Configurações
├── lib/              # Configurações (Supabase, etc)
├── hooks/            # Custom React hooks
├── types/            # TypeScript types e interfaces
├── utils/            # Funções utilitárias
├── App.tsx
└── main.tsx
```

## Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build de produção
npm run lint         # Executa o linter
```

## Entidades Principais

- **Clientes**: Importadores que contratam os serviços
- **Processos**: Operações de importação com referência única (XXXX.XXX.XXXX.XX)
- **Importadoras**: Empresas que realizam a importação
- **Contas Bancárias**: 13 contas para recebimento/pagamento
- **Depósitos**: Valores creditados pelos clientes
- **Despesas**: Custos vinculados a processos específicos

## Desenvolvimento em Fases

O projeto está sendo desenvolvido de forma incremental:

- ✅ **Fase 0**: Setup inicial (React + TypeScript + Tailwind + Supabase)
- ✅ **Fase 1**: Autenticação e estrutura base (Login, Rotas, Layout, Dashboard)
- ⏳ **Fase 2**: Cadastros básicos (Clientes, Contas, etc)
- ⏳ **Fase 3**: Módulo financeiro
- ⏳ **Fase 4**: Dashboard e relatórios

### Fase 1 - Concluída ✅

- Sistema de autenticação com Supabase Auth
- Tela de login com validação
- Proteção de rotas (PrivateRoute)
- Layout principal com Header e Sidebar
- Dashboard com cards de métricas
- Navegação entre páginas
- Sistema de logout

Ver [FASE_1_TESTES.md](./FASE_1_TESTES.md) para instruções de teste.

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
