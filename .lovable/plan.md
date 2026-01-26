
# Plano: Importação de Leads Meta Ads

## Objetivo
Criar um modal de importação que suporte dois tipos de leads:
1. **Lead Kommo** - Formato CSV atual (já existente)
2. **Lead Meta** - Novo formato Excel do Meta Ads

Permitir que todos os vendedores possam importar leads (não apenas admins).

## Resumo das Mudanças

### 1. Interface do Modal de Importação
- Adicionar seletor de tipo de lead no primeiro passo (Kommo ou Meta)
- Suporte a arquivos Excel (.xlsx) além de CSV
- Preview adaptado ao tipo selecionado
- Aceitar drag-and-drop para ambos os formatos

### 2. Parsing de Leads Meta
Criar função `parseMetaExcel` que extrai:
- **Nome**: da coluna `nome_completo` (separando pessoa/empresa se tiver `|`)
- **Empresa**: da coluna `qual_o_nome_da_sua_empresa?`
- **Telefone**: da coluna `telefone` (removendo prefixo `p:`)
- **Faturamento**: da coluna `qual_o_faturamento_mensal...` (normalizando valores)
- **UTMs**: extrair do `campaign_name` do Meta
- **Origem**: setar como "Meta Ads"
- **Data de criação**: da coluna `created_time`
- **Plataforma**: da coluna `platform` (ig/fb)

### 3. Normalização de Faturamento Meta
Converter formatos:
- `+1_milhão.` → `+1 Milhão`
- `até_r$50_mil` → `Até R$50 mil`
- `r$100_mil_a_r$250_mil` → `R$100 mil a R$250 mil`

---

## Detalhamento Tecnico

### Arquivos a Modificar

#### 1. `src/hooks/useImportLeads.ts`
- Adicionar dependência: biblioteca para parsing de Excel (usar `xlsx` ou SheetJS)
- Criar função `parseMetaExcel(file: File): Promise<ParsedLead[]>`
  - Ler arquivo Excel com SheetJS
  - Mapear colunas Meta para estrutura `ParsedLead`
  - Normalizar telefone (remover `p:` e formatar)
  - Normalizar faturamento
  - Extrair informacoes de campanha/anuncio para notas
- Atualizar `importLeads` para aceitar parâmetro `leadType: "kommo" | "meta"`
- Criar tag dinâmica baseada no tipo (ex: "Importação Meta - Janeiro 2026")

#### 2. `src/components/campanhas/ImportLeadsModal.tsx`
- Adicionar estado `leadType: "kommo" | "meta"`
- Modificar step "upload":
  - Adicionar toggle/selector para tipo de lead
  - Atualizar texto e formatos aceitos baseado no tipo
  - Aceitar `.xlsx` quando tipo for "meta"
- Atualizar `handleFileSelect`:
  - Chamar parser correto baseado no tipo
- Ajustar preview para mostrar campos relevantes do Meta

#### 3. Permissões (RLS ja ok)
- O botão de importar já está visível para todos na página `CampanhaDetail`
- As políticas RLS das tabelas `leads`, `campanha_leads` e `lead_tags` já permitem INSERT para `is_team_member()`

### Dependência a Instalar
```
npm install xlsx
```

### Fluxo do Usuario

```text
+------------------+     +-------------------+     +------------------+
|  1. Selecionar   | --> |  2. Upload do     | --> |  3. Preview e    |
|  Tipo de Lead    |     |  Arquivo          |     |  Configurar      |
|  (Kommo/Meta)    |     |  (.csv ou .xlsx)  |     |  Etapa/SDR       |
+------------------+     +-------------------+     +------------------+
                                                           |
                                                           v
                         +------------------+     +------------------+
                         |  5. Resultado    | <-- |  4. Importando   |
                         |  Final           |     |  (Progress)      |
                         +------------------+     +------------------+
```

### Mapeamento de Colunas Meta

| Coluna Excel | Campo Lead | Transformacao |
|--------------|------------|---------------|
| `nome_completo` | `name` | Separar nome/empresa por `\|` ou `l` |
| `qual_o_nome_da_sua_empresa?` | `company` | Direto |
| `telefone` | `phone` | Remover `p:`, formatar |
| `qual_o_faturamento_mensal...` | `faturamento` | Normalizar |
| `platform` | `utm_source` | `ig` → `instagram`, `fb` → `facebook` |
| `campaign_name` | `utm_campaign` | Direto |
| `ad_name` | `utm_content` | Direto |
| `adset_name` | `utm_medium` | Direto |
| `created_time` | nota | Registrar data original |
| `id` | nota | ID original do Meta |

### Exemplo de Bloco de Notas Meta

```
--- Meta Ads (campos) ---
ID: l:2224925607996947
Data: 26/01/2026 06:30
Campanha: 04.08.25 [LEADS META] [CBO] 60 dia
Anuncio: AD2
Conjunto: 24.11.25 Teste de Criativos
Plataforma: Instagram
--- /Meta Ads (campos) ---
```
