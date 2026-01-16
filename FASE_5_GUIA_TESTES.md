# 🧪 GUIA DE AUDITORIA E TESTES - FASE 5: COBRANÇA E FECHAMENTO

## 📍 Como Acessar as Páginas

### 1. **Acesse o Sistema**
- Abra o navegador em: **http://localhost:5173**
- Faça login com suas credenciais do Supabase
- Você será redirecionado para o Dashboard

### 2. **Navegação Principal (Sidebar)**

A navegação está no menu lateral esquerdo:

```
┌─────────────────────────────┐
│ 📊 Dashboard               │ ← /dashboard
│ 👥 Clientes                │ ← /clientes
│ 🏢 Importadoras            │ ← /importadoras
│ 📦 PROCESSOS              │ ← /processos (CLIQUE AQUI!)
│ 💰 Financeiro              │ ← /financeiro
│ 📈 Relatórios              │ ← /relatorios
│ ⚙️  Configurações          │ ← /configuracoes
└─────────────────────────────┘
```

**Para acessar a listagem de processos:**
- Clique em **"📦 Processos"** no menu lateral
- OU acesse diretamente: **http://localhost:5173/processos**

---

## ✅ CHECKLIST DE TESTES DA FASE 5

### TESTE 1: Verificar Badge "🚨 Aguardando Cobrança"

**Objetivo:** Confirmar que processos finalizados sem cobrança aparecem com badge vermelho

**Passos:**
1. Acesse `/processos`
2. Na tabela, procure por processos com status **"Finalizado"**
3. **Verificar:**
   - ✅ Processos finalizados SEM cobrança mostram: **"🚨 Aguardando Cobrança"** (fundo vermelho)
   - ✅ Processos finalizados e COBRADOS mostram: **"Faturado"** (fundo roxo)
   - ✅ Processos abertos mostram: **"Aberto"** (fundo azul)

**Arquivo:** `src/pages/processes/Processes.tsx:450-471`

---

### TESTE 2: Filtro "Pendentes de Cobrança"

**Objetivo:** Filtrar apenas processos finalizados que aguardam cobrança

**Passos:**
1. Acesse `/processos`
2. No card de filtros (topo da página), localize o dropdown **"Status"**
3. Selecione: **"🚨 Pendentes de Cobrança"**
4. Clique no botão **"Filtrar"**

**Verificar:**
- ✅ Tabela mostra APENAS processos finalizados sem `billed_at`
- ✅ Todos têm o badge **"🚨 Aguardando Cobrança"**
- ✅ Nenhum processo "Aberto" ou "Faturado" aparece

**Arquivo:** `src/pages/processes/Processes.tsx:104-131`

---

### TESTE 3: Botão "Marcar como Cobrado" (Detalhes do Processo)

**Objetivo:** Verificar que o botão aparece apenas para processos finalizados não cobrados

**Passos:**
1. Acesse `/processos`
2. Clique no ícone **"Ver extrato"** (ícone de documento) de um processo **"🚨 Aguardando Cobrança"**
3. Você será redirecionado para `/processos/{id}`

**Verificar:**
- ✅ No header da página, ao lado direito do título, aparece o botão verde:
  ```
  ✓ Marcar como Cobrado
  ```
- ✅ O botão é verde com ícone de check
- ✅ Se o processo já foi cobrado, o botão NÃO aparece

**Arquivo:** `src/pages/processes/ProcessDetails.tsx:135-145`

---

### TESTE 4: Modal de Cobrança

**Objetivo:** Testar o fluxo completo de marcar processo como cobrado

**Passos:**
1. Em um processo com status **"🚨 Aguardando Cobrança"**
2. Clique no botão **"✓ Marcar como Cobrado"**
3. Um modal deve aparecer no centro da tela

**Verificar no Modal:**
- ✅ Título: **"Marcar Processo como Cobrado"**
- ✅ Exibe **Processo** (referência): Ex: `0058.039.1209.25`
- ✅ Exibe **Cliente**: Ex: `EMPRESA XYZ`
- ✅ Exibe **Total de Despesas**: Ex: `R$ 5.432,10`
- ✅ Campo de texto (textarea): **"Observações (opcional)"**
- ✅ Botão **"Cancelar"** (cinza)
- ✅ Botão **"✓ Confirmar Cobrança"** (verde)

**Arquivo:** `src/pages/processes/ProcessDetails.tsx:289-355`

---

### TESTE 5: Confirmar Cobrança

**Objetivo:** Executar a ação de marcar como cobrado e verificar atualização

**Passos:**
1. No modal de cobrança (Teste 4)
2. Digite uma observação (ex: "Cobrado via boleto 12345")
3. Clique em **"✓ Confirmar Cobrança"**

**Verificar:**
- ✅ Aparece toast de sucesso: **"Processo marcado como cobrado com sucesso!"**
- ✅ Modal fecha automaticamente
- ✅ Botão **"Marcar como Cobrado"** desaparece (não é mais necessário)
- ✅ Na tabela de processos, o badge mudou de **"🚨 Aguardando Cobrança"** para **"Faturado"** (roxo)

**Arquivo:** `src/pages/processes/ProcessDetails.tsx:72-85`

---

### TESTE 6: Integração com Dashboard

**Objetivo:** Verificar que o alerta vermelho do dashboard reflete as mudanças

**Passos:**
1. Acesse `/dashboard`
2. Localize o card vermelho **"🚨 SEM Cobrança"** (terceiro card)
3. Anote o número exibido (ex: `3`)

**Teste A - Finalizar Processo:**
1. Vá em `/processos`
2. Finalize um processo em aberto (botão verde com ícone ✓)
3. Volte ao `/dashboard`
4. **Verificar:** Número no card vermelho AUMENTOU em 1

**Teste B - Marcar como Cobrado:**
1. Vá em `/processos`
2. Marque um processo "🚨 Aguardando Cobrança" como cobrado
3. Volte ao `/dashboard`
4. **Verificar:** Número no card vermelho DIMINUIU em 1

**Arquivo:** `src/services/dashboardService.ts:40-45`

---

### TESTE 7: Clique no Card Vermelho

**Objetivo:** Verificar navegação do dashboard para processos filtrados

**Passos:**
1. Acesse `/dashboard`
2. Clique no card vermelho **"🚨 SEM Cobrança"**

**Verificar:**
- ✅ Você é redirecionado para `/processos`
- ⚠️ **NOTA:** Atualmente vai para listagem geral (pode ser melhorado em sprint futura para aplicar filtro automaticamente)

**Arquivo:** `src/pages/dashboard/Dashboard.tsx:145-146`

---

## 🔍 AUDITORIA DE CÓDIGO

### Arquivos Modificados na Fase 5:

#### 1. **src/pages/processes/ProcessDetails.tsx**
**Linhas Importantes:**
- **5:** Importação de `billProcess`
- **17-19:** Estados para modal e observações
- **72-85:** Função `handleBillProcess()` - lógica de cobrança
- **135-145:** Botão condicional "Marcar como Cobrado"
- **289-355:** Modal completo de confirmação

**Verificar:**
```typescript
// Botão só aparece se: status === 'finalized' E billed_at === null
{process.status === 'finalized' && !process.billed_at && (
  <button onClick={() => setShowBillingModal(true)}>
    Marcar como Cobrado
  </button>
)}
```

#### 2. **src/pages/processes/Processes.tsx**
**Linhas Importantes:**
- **109-117:** Lógica de filtro "pending_billing"
- **452-457:** Badge vermelho "🚨 Aguardando Cobrança"
- **660:** Opção de filtro no dropdown

**Verificar:**
```typescript
// Badge vermelho quando finalizado sem cobrança
if (process.status === 'finalized' && !process.billed_at) {
  return <span className="bg-red-100 text-red-800">
    🚨 Aguardando Cobrança
  </span>
}
```

#### 3. **src/services/processService.ts**
**Linhas Importantes:**
- **163-177:** Função `billProcess()` - já existia

**Verificar:**
```typescript
export async function billProcess(id: string, notes?: string) {
  const { data, error } = await supabase
    .from('processes')
    .update({
      status: 'billed',
      billed_at: new Date().toISOString(), // ← Marca data de cobrança
      billing_notes: notes,                 // ← Salva observações
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## 🗄️ AUDITORIA DE BANCO DE DADOS

### Verificar Dados no Supabase:

1. Acesse: **https://supabase.com/dashboard**
2. Entre no projeto **FINANCOMEX**
3. Vá em **Table Editor** > **processes**

**Colunas para Auditar:**
- ✅ **status**: `'open'`, `'finalized'`, ou `'billed'`
- ✅ **finalized_at**: Data/hora quando finalizou (nullable)
- ✅ **billed_at**: Data/hora quando cobrou (nullable)
- ✅ **billing_notes**: Observações da cobrança (text, nullable)

**Queries SQL para Auditoria:**

```sql
-- 1. Contar processos aguardando cobrança (deve bater com dashboard)
SELECT COUNT(*)
FROM processes
WHERE status = 'finalized' AND billed_at IS NULL;

-- 2. Listar processos pendentes de cobrança
SELECT reference, client_id, finalized_at, billed_at, billing_notes
FROM processes
WHERE status = 'finalized' AND billed_at IS NULL
ORDER BY finalized_at DESC;

-- 3. Verificar último processo cobrado
SELECT reference, billed_at, billing_notes
FROM processes
WHERE status = 'billed'
ORDER BY billed_at DESC
LIMIT 1;

-- 4. Histórico de cobranças (com observações)
SELECT reference, billed_at, billing_notes
FROM processes
WHERE status = 'billed' AND billing_notes IS NOT NULL
ORDER BY billed_at DESC;
```

---

## 🐛 TROUBLESHOOTING

### Problema 1: "Não vejo a listagem de processos"

**Soluções:**
1. Verifique a URL: Deve ser **http://localhost:5173/processos**
2. Verifique se está logado
3. Clique no menu **"📦 Processos"** na sidebar
4. Limpe cache: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)

### Problema 2: "Botão 'Marcar como Cobrado' não aparece"

**Causas Possíveis:**
1. Processo não está finalizado → Finalize primeiro
2. Processo já foi cobrado → Verifique coluna `billed_at` no banco
3. Você está na listagem → Entre nos **detalhes** do processo

### Problema 3: "Erro ao marcar como cobrado"

**Debug:**
1. Abra DevTools: `F12`
2. Vá na aba **Console**
3. Clique em "Marcar como Cobrado"
4. Copie o erro e verifique:
   - Permissões no Supabase (RLS policies)
   - Conexão com banco de dados

### Problema 4: "Dashboard não atualiza o número"

**Soluções:**
1. Dê refresh na página: `F5`
2. Verifique se o processo realmente foi cobrado no banco
3. Execute a query SQL de auditoria (ver seção acima)

---

## 📊 CENÁRIOS DE TESTE COMPLETOS

### Cenário 1: Processo Novo → Finalizado → Cobrado

1. **Criar Processo:**
   - Vá em `/processos` → Novo Processo
   - Referência: `0001.001.0001.01`
   - Status inicial: **Aberto**

2. **Adicionar Despesa:**
   - Vá em `/financeiro`
   - Crie uma despesa vinculada ao processo
   - Valor: `R$ 1.000,00`

3. **Finalizar Processo:**
   - Volte em `/processos`
   - Clique no botão verde (✓ Finalizar)
   - Status muda para **Finalizado**

4. **Verificar Alerta:**
   - Vá em `/dashboard`
   - Card vermelho **aumentou** em 1
   - Badge na listagem: **🚨 Aguardando Cobrança**

5. **Marcar como Cobrado:**
   - Vá nos detalhes do processo
   - Clique **"Marcar como Cobrado"**
   - Adicione observação: "Pago via PIX"
   - Confirme

6. **Verificar Resultado:**
   - Dashboard: Card vermelho **diminuiu** em 1
   - Listagem: Badge mudou para **Faturado** (roxo)
   - Detalhes: Botão "Marcar como Cobrado" desapareceu

### Cenário 2: Filtro de Pendentes

1. Tenha pelo menos 3 processos:
   - 1 Aberto
   - 1 Finalizado (sem cobrança)
   - 1 Faturado

2. Vá em `/processos`
3. Selecione filtro: **🚨 Pendentes de Cobrança**
4. Clique **Filtrar**
5. **Resultado:** Apenas 1 processo aparece (o finalizado sem cobrança)

---

## ✅ CHECKLIST FINAL

Marque cada item após testar:

- [ ] Badge "🚨 Aguardando Cobrança" aparece corretamente
- [ ] Filtro "Pendentes de Cobrança" funciona
- [ ] Botão "Marcar como Cobrado" aparece apenas quando devido
- [ ] Modal de cobrança abre e fecha corretamente
- [ ] Campo de observações aceita texto
- [ ] Confirmação de cobrança funciona
- [ ] Toast de sucesso aparece
- [ ] Dashboard atualiza (card vermelho)
- [ ] Badge muda para "Faturado" após cobrança
- [ ] Botão desaparece após cobrança
- [ ] Dados salvos corretamente no banco (billed_at, billing_notes)

---

## 📝 RELATÓRIO DE BUGS

Se encontrar bugs durante os testes, documente assim:

```
BUG #001
Título: [Descreva o bug]
Passos para Reproduzir:
1. ...
2. ...
3. ...

Resultado Esperado: ...
Resultado Obtido: ...
Evidência: [Screenshot ou erro do console]
Arquivo: [Ex: ProcessDetails.tsx:135]
```

---

## 🎯 CONCLUSÃO

Após completar todos os testes, você terá validado:
- ✅ Funcionalidade de cobrança completa
- ✅ Alertas e badges funcionando
- ✅ Filtros operacionais
- ✅ Integração com dashboard
- ✅ Persistência de dados no banco

**Tempo estimado de testes:** 15-20 minutos

Boa auditoria! 🚀
