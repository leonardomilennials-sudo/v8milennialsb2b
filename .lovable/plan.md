
# Plano: Reestruturação Completa do Módulo Upsell

## Resumo das Mudanças

Este plano reestrutura o módulo de Upsell em 4 grandes blocos:

1. **Novo Pipeline de Campanhas** com foco em valores planejados (MRR e Projeto)
2. **Base de Clientes em formato Kanban** organizada por estágio do cliente
3. **Metas de Upsell** integradas ao sistema de metas existente
4. **Analytics atualizado** com métricas de planejado vs vendido

---

## Parte 1: Novo Pipeline de Campanhas

### Novas Colunas do Kanban
Atualizar o fluxo de status para incluir etapa inicial "Cliente":
- **Cliente** (cinza) - Cliente selecionado, sem planejamento
- **Planejado** (azul) - Produto e valores definidos
- **Abordado** (amarelo) - Contato realizado
- **Interesse Gerado** (laranja) - Cliente demonstrou interesse
- **Proposta Enviada** (azul forte) - Proposta formal enviada
- **Vendido** (verde) - Fechado com sucesso
- **Futuro** (roxo) - Para próximo ciclo
- **Perdido** (vermelho) - Não converteu

### Novos Campos na Campanha (Database)
Adicionar colunas em `upsell_campanhas`:
- `product_id` (UUID, FK para products) - Produto planejado
- `mrr_planejado` (numeric) - MRR esperado se for produto recorrente
- `projeto_planejado` (numeric) - Valor projeto se for produto pontual
- `valor_produto` (numeric) - Preço negociado do produto

### Card do Kanban Atualizado
O card agora mostra informações focadas no upsell:
- Nome do cliente (compacto)
- Produto planejado (se definido)
- MRR Planejado ou Projeto Planejado
- Tipo de ação e canal
- Responsável pela abordagem

---

## Parte 2: Base de Clientes em Kanban

### Nova Visualização
Trocar a tabela atual por um Kanban organizado por `tipo_cliente_tempo`:
- **Onboarding** (0-30 dias)
- **Recentes** (30-60 dias)
- **Iniciantes** (60-90 dias)
- **Momento-chave** (90-180 dias)
- **Fiéis** (180-360 dias)
- **Mavericks** (+1 ano)

### Cards de Cliente
Cada card exibe:
- Nome do cliente
- Setor
- MRR Atual
- LTV Atual
- Potencial de expansão (badge colorido)
- Responsável

### Ações no Card
- Clique: Abre modal de detalhes
- Drag & drop: Permite mover entre estágios (atualiza tipo_cliente_tempo)

---

## Parte 3: Metas de Upsell

### Novo Tipo de Meta
Adicionar tipo "upsell" no sistema de metas existente:
- **Meta MRR Upsell** - Meta de MRR adicional via expansão
- **Meta Projeto Upsell** - Meta de projetos pontuais via base

### Onde Aparece
1. Na página de Gestão de Metas (`/metas`) - Seção dedicada "Metas de Upsell"
2. No dashboard de campanhas - Widget de progresso no topo

### Progresso Automático
O sistema calcula automaticamente:
- MRR Vendido = soma de `valor_fechado` onde produto.type = "mrr"
- Projeto Vendido = soma de `valor_fechado` onde produto.type != "mrr"

---

## Parte 4: Analytics Atualizado

### Novas Métricas no Topo
- **MRR Planejado** - Soma de mrr_planejado das campanhas do mês
- **MRR Vendido** - Soma de valor_fechado (produtos MRR) com status "vendido"
- **Projeto Planejado** - Soma de projeto_planejado
- **Projeto Vendido** - Soma de valor_fechado (produtos não-MRR) com status "vendido"
- **Meta MRR** (se existir) - Barra de progresso
- **Meta Projeto** (se existir) - Barra de progresso

### Gráficos
- Planejado vs Vendido (barras comparativas)
- Funil de conversão por etapa
- Performance por canal e tipo de ação

---

## Fluxo de Criação de Campanha Atualizado

1. **Selecionar Cliente** (busca na base)
2. **Escolher Produto** (lista de produtos ativos)
3. **Definir Valor** (preço negociado)
4. **Sistema calcula**:
   - Se produto.type = "mrr" → preenche mrr_planejado
   - Se produto.type != "mrr" → preenche projeto_planejado
5. **Definir tipo de ação, canal, responsável**
6. **Criar** → Status inicial = "planejado"

---

## Detalhes Técnicos

### Alteração no Banco de Dados
```sql
ALTER TABLE upsell_campanhas
ADD COLUMN product_id UUID REFERENCES products(id),
ADD COLUMN mrr_planejado NUMERIC DEFAULT 0,
ADD COLUMN projeto_planejado NUMERIC DEFAULT 0,
ADD COLUMN valor_produto NUMERIC DEFAULT 0;
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useUpsell.ts` | Atualizar tipos e status columns |
| `src/components/upsell/UpsellKanban.tsx` | Adicionar coluna "Cliente" |
| `src/components/upsell/UpsellCard.tsx` | Mostrar produto e valores planejados |
| `src/components/upsell/CreateCampanhaUpsellModal.tsx` | Adicionar seleção de produto e cálculo automático |
| `src/components/upsell/UpsellDetailModal.tsx` | Adicionar campos de produto e valores |
| `src/components/upsell/ClientesList.tsx` | Trocar tabela por Kanban |
| `src/components/upsell/CampanhaAnalyticsSection.tsx` | Adicionar métricas planejado/vendido |
| `src/pages/GestaoMetas.tsx` | Adicionar seção de metas upsell |
| `src/hooks/useGoals.ts` | Suportar tipo "upsell" |

### Novos Componentes

| Componente | Descrição |
|------------|-----------|
| `ClientesKanban.tsx` | Kanban de clientes por estágio |
| `ClienteCard.tsx` | Card de cliente para o Kanban |
| `UpsellGoalWidget.tsx` | Widget de progresso da meta no dashboard |

---

## Ordem de Implementação

1. Migração do banco (adicionar colunas)
2. Atualizar hooks e tipos TypeScript
3. Implementar Kanban de Clientes
4. Atualizar pipeline de Campanhas
5. Implementar metas de Upsell
6. Atualizar Analytics
