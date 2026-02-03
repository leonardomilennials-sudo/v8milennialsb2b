

# Plano: Adicionar Temperatura, Valor e Produto na Exportação de Propostas

## Objetivo
Incluir três novas colunas na exportação Excel do Pipe Propostas:
1. **Temperatura** (calor/foguinho) - escala de 1-10
2. **Valor da Venda** - valor fechado na proposta
3. **Produto** - nome do produto selecionado

---

## Mudanças na Exportação

### Novas Colunas

| Coluna Atual | Nova Coluna | Descrição |
|--------------|-------------|-----------|
| ... campos existentes ... | | |
| Etapa | *(já existe)* | Status atual |
| **Temperatura** | `item.calor` | Valor de 1-10 (foguinho) |
| **Valor** | `item.sale_value` | Valor em reais |
| **Produto** | `item.product?.name` | Nome do produto principal |

### Estrutura Final do Excel

```text
Nome | Empresa | Email | Telefone | Faturamento | Segmento | Notas | Prioridade | Origem | Etapa | Temperatura | Valor | Produto | UTMs...
```

---

## Implementação Técnica

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/PipePropostas.tsx` | Adicionar 3 novas colunas no `exportData` |

### Código da Mudança

Dentro da função `handleExportProposals`, no mapeamento `exportData`:

```typescript
const exportData = pipeData.map((item) => {
  const lead = item.lead;
  return {
    Nome: lead?.name || "",
    Empresa: lead?.company || "",
    Email: lead?.email || "",
    Telefone: lead?.phone || "",
    Faturamento: lead?.faturamento || "",
    Segmento: lead?.segment || "",
    Notas: item.notes || lead?.notes || "",
    "Prioridade do lead": getPriorityLabel(lead?.rating),
    "Público de origem": lead?.origin ? (originMap[lead.origin] || lead.origin) : "",
    Etapa: statusMap[item.status] || item.status,
    Temperatura: item.calor || "",           // NOVO
    Valor: item.sale_value || "",            // NOVO
    Produto: item.product?.name || "",       // NOVO
    utm_campaign: lead?.utm_campaign || "",
    utm_source: lead?.utm_source || "",
    utm_medium: lead?.utm_medium || "",
    utm_content: lead?.utm_content || "",
    utm_term: lead?.utm_term || "",
  };
});
```

---

## Resultado Esperado

O arquivo Excel exportado terá:
- **Temperatura**: Número de 1-10 indicando o "calor" do lead
- **Valor**: Valor monetário da proposta (ex: 5000)
- **Produto**: Nome do produto principal (ex: "Milennials Outbound")

