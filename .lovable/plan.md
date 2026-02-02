
# Plano: Exportar Base Completa de Leads para Excel

## Objetivo
Criar uma funcionalidade para exportar um Excel completo com todos os leads e suas informações relacionadas (pipelines, tags, responsáveis, etc.) para importação em um sistema réplica.

---

## Estrutura do Excel

O arquivo terá **múltiplas abas** para organizar os dados de forma completa:

### Aba 1: Leads (Principal)
Contém todos os campos do lead com dados relacionados:

| Coluna | Descrição |
|--------|-----------|
| id | ID único do lead (UUID) |
| name | Nome do lead |
| company | Empresa |
| email | Email |
| phone | Telefone |
| origin | Origem (calendly, whatsapp, meta_ads, etc.) |
| rating | Nota de qualidade (0-10) |
| segment | Segmento |
| faturamento | Faixa de faturamento |
| urgency | Urgência |
| notes | Notas/Observações |
| sdr_id | ID do SDR responsável |
| sdr_nome | Nome do SDR |
| closer_id | ID do Closer responsável |
| closer_nome | Nome do Closer |
| tags | Tags separadas por vírgula |
| compromisso_date | Data de compromisso |
| utm_campaign | UTM Campaign |
| utm_source | UTM Source |
| utm_medium | UTM Medium |
| utm_content | UTM Content |
| utm_term | UTM Term |
| created_at | Data de criação |
| updated_at | Data de atualização |

### Aba 2: Pipe WhatsApp
Status do lead no pipeline de WhatsApp:

| Coluna | Descrição |
|--------|-----------|
| id | ID do registro |
| lead_id | ID do lead |
| lead_nome | Nome do lead |
| status | Status (novo, abordado, respondeu, esfriou, agendado) |
| sdr_id | ID do SDR |
| sdr_nome | Nome do SDR |
| scheduled_date | Data agendada |
| notes | Notas |
| created_at | Data de criação |

### Aba 3: Pipe Confirmação
Status do lead no pipeline de confirmação de reuniões:

| Coluna | Descrição |
|--------|-----------|
| id | ID do registro |
| lead_id | ID do lead |
| lead_nome | Nome do lead |
| status | Status da confirmação |
| meeting_date | Data da reunião |
| is_confirmed | Se foi confirmada |
| sdr_id | ID do SDR |
| sdr_nome | Nome do SDR |
| closer_id | ID do Closer |
| closer_nome | Nome do Closer |
| notes | Notas |
| created_at | Data de criação |

### Aba 4: Pipe Propostas
Status do lead no pipeline de propostas:

| Coluna | Descrição |
|--------|-----------|
| id | ID do registro |
| lead_id | ID do lead |
| lead_nome | Nome do lead |
| status | Status (marcar_compromisso, vendido, perdido, etc.) |
| product_id | ID do produto |
| product_nome | Nome do produto |
| product_type | Tipo (mrr, projeto, unitario) |
| sale_value | Valor da venda |
| calor | Temperatura (1-10) |
| commitment_date | Data de compromisso |
| contract_duration | Duração do contrato |
| is_contract_signed | Contrato assinado |
| closer_id | ID do Closer |
| closer_nome | Nome do Closer |
| notes | Notas |
| closed_at | Data de fechamento |
| created_at | Data de criação |

### Aba 5: Tags
Lista de todas as tags disponíveis:

| Coluna | Descrição |
|--------|-----------|
| id | ID da tag |
| name | Nome |
| color | Cor |

### Aba 6: Team Members
Lista de membros da equipe (para referência de IDs):

| Coluna | Descrição |
|--------|-----------|
| id | ID do membro |
| name | Nome |
| email | Email |
| role | Função (admin, sdr, closer) |
| is_active | Se está ativo |

### Aba 7: Products
Lista de produtos (para referência de IDs):

| Coluna | Descrição |
|--------|-----------|
| id | ID do produto |
| name | Nome |
| type | Tipo (mrr, projeto, unitario) |
| ticket | Valor padrão |
| ticket_minimo | Valor mínimo |

---

## Implementação Técnica

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useExportLeads.ts` | Criar hook com lógica de exportação |
| `src/pages/Leads.tsx` | Adicionar botão "Exportar Excel" |

### Bibliotecas Utilizadas
- **xlsx** (já instalada) - Para gerar o arquivo Excel com múltiplas abas

### Fluxo de Exportação
1. Usuário clica no botão "Exportar Excel"
2. Sistema busca todos os dados das tabelas relacionadas
3. Monta as abas do Excel com os dados formatados
4. Gera o arquivo .xlsx e inicia o download automático

### Código Principal (Snippet)
```typescript
// useExportLeads.ts
import * as XLSX from "xlsx";

export function useExportLeads() {
  const exportToExcel = async () => {
    // Buscar todos os dados
    const { data: leads } = await supabase.from("leads").select(`
      *, sdr:team_members!leads_sdr_id_fkey(id, name),
      closer:team_members!leads_closer_id_fkey(id, name),
      lead_tags(tag:tags(id, name, color))
    `);
    
    const { data: pipeWhatsapp } = await supabase.from("pipe_whatsapp").select(`...`);
    const { data: pipeConfirmacao } = await supabase.from("pipe_confirmacao").select(`...`);
    const { data: pipePropostas } = await supabase.from("pipe_propostas").select(`...`);
    
    // Criar workbook com múltiplas abas
    const wb = XLSX.utils.book_new();
    
    // Adicionar cada aba
    XLSX.utils.book_append_sheet(wb, leadsSheet, "Leads");
    XLSX.utils.book_append_sheet(wb, whatsappSheet, "Pipe_WhatsApp");
    // ... demais abas
    
    // Download
    XLSX.writeFile(wb, `leads_export_${date}.xlsx`);
  };
}
```

---

## Resultado Esperado

Um arquivo Excel com 7 abas contendo:
- Todos os leads com informações completas
- Status em cada pipeline (WhatsApp, Confirmação, Propostas)
- Referências para tags, membros da equipe e produtos
- IDs preservados para facilitar a importação no sistema réplica
