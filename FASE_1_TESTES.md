# FASE 1 - Testes de Autenticação

## 🔐 Como Testar o Sistema

### Pré-requisitos

Antes de testar o login, você precisa:

1. **Criar um projeto no Supabase:**
   - Acesse https://supabase.com/dashboard
   - Crie um novo projeto (gratuito)
   - Aguarde a criação (leva ~2 minutos)

2. **Configurar as variáveis de ambiente:**
   - Vá em Settings > API no dashboard do Supabase
   - Copie a "Project URL" e a "anon/public key"
   - Edite o arquivo `.env.local` e cole as credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

3. **Criar um usuário de teste** no Supabase:
   - Acesse o Supabase Dashboard
   - Vá em Authentication > Users
   - Clique em "Add user" > "Create new user"
   - Email: `teste@financomex.com`
   - Senha: `senha123` (ou qualquer senha de sua preferência)

---

## 🧪 Como Testar

### 1. Teste de Proteção de Rotas
1. Acesse http://localhost:5173
2. Você será **automaticamente redirecionado para /login** (não autenticado)
3. Tente acessar http://localhost:5173/dashboard diretamente
4. Deve ser redirecionado para /login

### 2. Teste de Login
1. Na tela de login, tente enviar sem preencher os campos
   - ✅ Deve mostrar: "Por favor, preencha todos os campos"
2. Digite um email inválido (sem @)
   - ✅ Deve mostrar: "Email inválido"
3. Digite um email/senha incorretos
   - ✅ Deve mostrar: "Email ou senha incorretos"
4. Digite credenciais corretas do Supabase
   - ✅ Deve redirecionar para /dashboard

### 3. Testar Dashboard

Após login bem-sucedido, você deve ver:
- Header no topo com seu email e botão "Sair"
- Sidebar à esquerda com menu de navegação
- Dashboard com:
  - 4 cards de métricas
  - Lista de últimas movimentações
  - Alertas importantes

### 4. Testar Navegação

Clique nos itens da sidebar:
- Dashboard (destaque azul quando ativo)
- Clientes (página placeholder)
- Processos (página placeholder)
- Financeiro (página placeholder)
- Relatórios (placeholder)
- Configurações (placeholder)

### 5. Testar Logout

Clique no botão "Sair" no header. Você deve ser redirecionado para a tela de login.

### 6. Testar Proteção de Rotas

Após fazer logout, tente acessar diretamente:
- http://localhost:5173/dashboard
- http://localhost:5173/clientes

Você deve ser redirecionado automaticamente para `/login`.

---

## 📁 Estrutura Final da Fase 1

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx       ✅ (com logout)
│   │   ├── Sidebar.tsx       ✅ (navegação completa)
│   │   └── MainLayout.tsx    ✅
│   └── PrivateRoute.tsx      ✅ (proteção de rotas)
├── contexts/
│   └── AuthContext.tsx       ✅ (autenticação Supabase)
├── pages/
│   ├── auth/
│   │   └── Login.tsx         ✅ (formulário completo)
│   ├── dashboard/
│   │   └── Dashboard.tsx     ✅ (com cards e dados mock)
│   ├── clients/Clients.tsx   ✅ (placeholder)
│   ├── processes/Processes.tsx ✅
│   ├── financial/Financial.tsx ✅
│   ├── reports/Reports.tsx ✅
│   └── settings/Settings.tsx ✅
└── App.tsx (rotas configuradas) ✅
