import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "./useRealtimeSubscription";

// Types
export interface UpsellClient {
  id: string;
  nome_cliente: string;
  cnpj: string | null;
  setor: string | null;
  tipo_cliente: "fabrica" | "distribuidora" | "outro";
  responsavel_interno: string | null;
  tipo_cliente_tempo: "onboarding" | "recentes" | "iniciantes" | "momento_chave" | "fieis" | "mavericks";
  mrr_atual: number;
  ticket_medio_historico: number;
  ltv_atual: number;
  ltv_projetado: number;
  tempo_contrato_meses: number;
  potencial_expansao: "baixo" | "medio" | "alto";
  data_primeira_venda: string | null;
  pipe_proposta_id: string | null;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
  responsavel?: { id: string; name: string } | null;
  lead?: { id: string; name: string; company: string | null } | null;
}

export interface UpsellProduto {
  id: string;
  upsell_client_id: string;
  product_id: string | null;
  status: "ativo" | "elegivel" | "ofertado_passado" | "bloqueado";
  created_at: string;
  product?: { id: string; name: string; type: string } | null;
}

export interface UpsellCampanha {
  id: string;
  upsell_client_id: string;
  mes: number;
  ano: number;
  tipo_acao: "upsell_ativacao" | "cross_sell" | "expansao_escopo" | "recontratacao";
  campanha_nome: string | null;
  canal: "whatsapp" | "reuniao" | "anuncio_base" | "automacao" | "manual";
  status: "planejado" | "abordado" | "interesse_gerado" | "proposta_enviada" | "vendido" | "futuro" | "perdido";
  data_abordagem: string | null;
  observacoes: string | null;
  valor_fechado: number;
  receita_incremental: number;
  impacto_ltv: number;
  responsavel_fechamento: string | null;
  pipe_proposta_id: string | null;
  created_at: string;
  updated_at: string;
  client?: UpsellClient | null;
  responsavel?: { id: string; name: string } | null;
}

export type UpsellStatus = UpsellCampanha["status"];

export const upsellStatusColumns: { id: UpsellStatus; title: string; color: string }[] = [
  { id: "planejado", title: "Planejado", color: "#64748B" },
  { id: "abordado", title: "Abordado", color: "#F5C518" },
  { id: "interesse_gerado", title: "Interesse Gerado", color: "#F97316" },
  { id: "proposta_enviada", title: "Proposta Enviada", color: "#3B82F6" },
  { id: "vendido", title: "Vendido ✓", color: "#22C55E" },
  { id: "futuro", title: "Futuro", color: "#8B5CF6" },
  { id: "perdido", title: "Perdido", color: "#EF4444" },
];

export const tipoClienteTempoLabels: Record<string, string> = {
  onboarding: "Onboarding (0-30 dias)",
  recentes: "Recentes (30-60 dias)",
  iniciantes: "Iniciantes (60-90 dias)",
  momento_chave: "Momento-chave (90-180 dias)",
  fieis: "Fiéis (180-360 dias)",
  mavericks: "Mavericks (+1 ano)",
};

export const tipoAcaoLabels: Record<string, string> = {
  upsell_ativacao: "Upsell de Ativação",
  cross_sell: "Cross-sell",
  expansao_escopo: "Expansão de Escopo",
  recontratacao: "Recontratação",
};

export const canalLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  reuniao: "Reunião",
  anuncio_base: "Anúncio para Base",
  automacao: "Automação",
  manual: "Manual",
};

// Hook for Upsell Clients
export function useUpsellClients() {
  useRealtimeSubscription("upsell_clients", ["upsell_clients"]);

  return useQuery({
    queryKey: ["upsell_clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upsell_clients")
        .select(`
          *,
          responsavel:team_members!upsell_clients_responsavel_interno_fkey(id, name),
          lead:leads(id, name, company)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as unknown as UpsellClient[];
    },
  });
}

// Hook for Upsell Campanhas (pipeline)
export function useUpsellCampanhas(mes?: number, ano?: number) {
  useRealtimeSubscription("upsell_campanhas", ["upsell_campanhas"]);

  return useQuery({
    queryKey: ["upsell_campanhas", mes, ano],
    queryFn: async () => {
      let query = supabase
        .from("upsell_campanhas")
        .select(`
          *,
          client:upsell_clients(
            id, nome_cliente, cnpj, setor, tipo_cliente, tipo_cliente_tempo,
            mrr_atual, ltv_atual, ltv_projetado, potencial_expansao,
            responsavel:team_members!upsell_clients_responsavel_interno_fkey(id, name)
          ),
          responsavel:team_members!upsell_campanhas_responsavel_fechamento_fkey(id, name)
        `)
        .order("updated_at", { ascending: false });

      if (mes !== undefined && ano !== undefined) {
        query = query.eq("mes", mes).eq("ano", ano);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as UpsellCampanha[];
    },
  });
}

// Hook for Upsell Produtos
export function useUpsellProdutos(clientId?: string) {
  return useQuery({
    queryKey: ["upsell_produtos", clientId],
    queryFn: async () => {
      let query = supabase
        .from("upsell_produtos")
        .select(`
          *,
          product:products(id, name, type)
        `);

      if (clientId) {
        query = query.eq("upsell_client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as UpsellProduto[];
    },
    enabled: !!clientId,
  });
}

// Create Upsell Client
export function useCreateUpsellClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: Partial<UpsellClient>) => {
      const { data, error } = await supabase
        .from("upsell_clients")
        .insert(client as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upsell_clients"] });
    },
  });
}

// Update Upsell Client
export function useUpdateUpsellClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UpsellClient> & { id: string }) => {
      const { data, error } = await supabase
        .from("upsell_clients")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upsell_clients"] });
    },
  });
}

// Create Upsell Campanha
export function useCreateUpsellCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campanha: Partial<UpsellCampanha>) => {
      const { data, error } = await supabase
        .from("upsell_campanhas")
        .insert(campanha as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upsell_campanhas"] });
    },
  });
}

// Update Upsell Campanha
export function useUpdateUpsellCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UpsellCampanha> & { id: string }) => {
      const { data, error } = await supabase
        .from("upsell_campanhas")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upsell_campanhas"] });
    },
  });
}

// Delete Upsell Campanha
export function useDeleteUpsellCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("upsell_campanhas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upsell_campanhas"] });
    },
  });
}

// Upsell Produto mutations
export function useCreateUpsellProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (produto: Partial<UpsellProduto>) => {
      const { data, error } = await supabase
        .from("upsell_produtos")
        .insert(produto as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upsell_produtos"] });
    },
  });
}

export function useUpdateUpsellProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UpsellProduto> & { id: string }) => {
      const { data, error } = await supabase
        .from("upsell_produtos")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upsell_produtos"] });
    },
  });
}

export function useDeleteUpsellProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("upsell_produtos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upsell_produtos"] });
    },
  });
}

// Helper: Create or update upsell client from sold proposal
export async function createOrUpdateUpsellFromProposal(
  propostaId: string,
  leadId: string,
  leadName: string,
  closerId: string | null,
  saleValue: number,
  productId: string | null
) {
  // Fetch full lead info to get company, segment, faturamento, etc.
  const { data: leadData } = await supabase
    .from("leads")
    .select("id, name, company, segment, faturamento, email, phone, sdr_id, closer_id")
    .eq("id", leadId)
    .maybeSingle();

  // Fetch product info to determine if it's MRR type
  const { data: productData } = await supabase
    .from("products")
    .select("id, name, type, ticket")
    .eq("id", productId || "")
    .maybeSingle();

  // Check if client already exists for this lead
  const { data: existingClient } = await supabase
    .from("upsell_clients")
    .select("id, mrr_atual, ltv_atual, tempo_contrato_meses")
    .eq("lead_id", leadId)
    .maybeSingle();

  const now = new Date().toISOString();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Calculate MRR (only for recurring products) and LTV
  const isMrrProduct = productData?.type === "mrr";
  const mrrToAdd = isMrrProduct ? saleValue : 0;

  // Determine tipo_cliente based on segment/faturamento
  let tipoCliente: "fabrica" | "distribuidora" | "outro" = "outro";
  if (leadData?.segment?.toLowerCase().includes("fabrica") || leadData?.segment?.toLowerCase().includes("fábrica")) {
    tipoCliente = "fabrica";
  } else if (leadData?.segment?.toLowerCase().includes("distribuid")) {
    tipoCliente = "distribuidora";
  }

  // Use company name if available, otherwise lead name
  const clientName = leadData?.company || leadData?.name || leadName;

  if (existingClient) {
    // Update existing client
    const newMrr = (existingClient.mrr_atual || 0) + mrrToAdd;
    const newLtv = (existingClient.ltv_atual || 0) + saleValue;
    const newMonths = (existingClient.tempo_contrato_meses || 0) + 1;

    // Calculate tipo_cliente_tempo based on months
    let tipoClienteTempo = "onboarding";
    if (newMonths > 12) tipoClienteTempo = "mavericks";
    else if (newMonths > 6) tipoClienteTempo = "fieis";
    else if (newMonths > 3) tipoClienteTempo = "momento_chave";
    else if (newMonths > 2) tipoClienteTempo = "iniciantes";
    else if (newMonths > 1) tipoClienteTempo = "recentes";

    await supabase
      .from("upsell_clients")
      .update({
        nome_cliente: clientName,
        mrr_atual: newMrr,
        ltv_atual: newLtv,
        tempo_contrato_meses: newMonths,
        tipo_cliente_tempo: tipoClienteTempo,
        setor: leadData?.segment || undefined,
        tipo_cliente: tipoCliente,
        responsavel_interno: closerId || leadData?.closer_id || undefined,
        updated_at: now,
      })
      .eq("id", existingClient.id);

    // Create campanha entry as vendido
    await supabase.from("upsell_campanhas").insert({
      upsell_client_id: existingClient.id,
      mes: currentMonth,
      ano: currentYear,
      status: "vendido",
      tipo_acao: existingClient ? "upsell_ativacao" : "cross_sell",
      valor_fechado: saleValue,
      receita_incremental: saleValue,
      impacto_ltv: saleValue,
      data_abordagem: now,
      responsavel_fechamento: closerId,
      pipe_proposta_id: propostaId,
      campanha_nome: `Venda - ${clientName}`,
    });

    // Add product as ativo if provided
    if (productId) {
      // Check if product already exists for this client
      const { data: existingProduto } = await supabase
        .from("upsell_produtos")
        .select("id")
        .eq("upsell_client_id", existingClient.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existingProduto) {
        await supabase
          .from("upsell_produtos")
          .update({ status: "ativo" })
          .eq("id", existingProduto.id);
      } else {
        await supabase.from("upsell_produtos").insert({
          upsell_client_id: existingClient.id,
          product_id: productId,
          status: "ativo",
        });
      }
    }
  } else {
    // Create new client with full info
    const { data: newClient } = await supabase
      .from("upsell_clients")
      .insert({
        nome_cliente: clientName,
        lead_id: leadId,
        pipe_proposta_id: propostaId,
        responsavel_interno: closerId || leadData?.closer_id,
        setor: leadData?.segment,
        tipo_cliente: tipoCliente,
        mrr_atual: mrrToAdd,
        ltv_atual: saleValue,
        ticket_medio_historico: saleValue,
        data_primeira_venda: now,
        tipo_cliente_tempo: "onboarding",
        tempo_contrato_meses: 1,
        potencial_expansao: "medio",
      })
      .select()
      .single();

    if (newClient) {
      // Create campanha entry as vendido
      await supabase.from("upsell_campanhas").insert({
        upsell_client_id: newClient.id,
        mes: currentMonth,
        ano: currentYear,
        status: "vendido",
        tipo_acao: "cross_sell",
        valor_fechado: saleValue,
        receita_incremental: saleValue,
        impacto_ltv: saleValue,
        data_abordagem: now,
        responsavel_fechamento: closerId,
        pipe_proposta_id: propostaId,
        campanha_nome: `Primeira Venda - ${clientName}`,
      });

      // Add product as ativo if provided
      if (productId) {
        await supabase.from("upsell_produtos").insert({
          upsell_client_id: newClient.id,
          product_id: productId,
          status: "ativo",
        });
      }
    }
  }
}
