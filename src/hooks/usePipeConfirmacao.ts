import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type PipeConfirmacao = Tables<"pipe_confirmacao">;
export type PipeConfirmacaoInsert = TablesInsert<"pipe_confirmacao">;
export type PipeConfirmacaoUpdate = TablesUpdate<"pipe_confirmacao">;

export type PipeConfirmacaoStatus = 
  | "reuniao_marcada"
  | "confirmar_d3"
  | "confirmar_d1"
  | "pre_confirmada"
  | "confirmacao_no_dia"
  | "confirmada_no_dia"
  | "compareceu"
  | "perdido";

export const statusColumns: { id: PipeConfirmacaoStatus; title: string; color: string }[] = [
  { id: "reuniao_marcada", title: "Reunião Marcada", color: "#6366f1" },
  { id: "confirmar_d3", title: "Confirmar D-3", color: "#f59e0b" },
  { id: "confirmar_d1", title: "Confirmar D-1", color: "#f59e0b" },
  { id: "pre_confirmada", title: "Pré Confirmada", color: "#10b981" },
  { id: "confirmacao_no_dia", title: "Confirmação | No dia", color: "#3b82f6" },
  { id: "confirmada_no_dia", title: "Confirmada | No dia", color: "#22c55e" },
  { id: "compareceu", title: "Compareceu ✓", color: "#16a34a" },
  { id: "perdido", title: "Perdido ✗", color: "#ef4444" },
];

export function usePipeConfirmacao() {
  return useQuery({
    queryKey: ["pipe_confirmacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipe_confirmacao")
        .select(`
          *,
          lead:leads(
            id, name, company, email, phone, rating, origin, segment, faturamento,
            sdr:team_members!leads_sdr_id_fkey(id, name),
            closer:team_members!leads_closer_id_fkey(id, name),
            lead_tags(tag:tags(id, name, color))
          ),
          sdr:team_members!pipe_confirmacao_sdr_id_fkey(id, name),
          closer:team_members!pipe_confirmacao_closer_id_fkey(id, name)
        `)
        .order("meeting_date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePipeConfirmacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: PipeConfirmacaoInsert) => {
      const { data, error } = await supabase
        .from("pipe_confirmacao")
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipe_confirmacao"] });
    },
  });
}

export function useUpdatePipeConfirmacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: PipeConfirmacaoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("pipe_confirmacao")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipe_confirmacao"] });
    },
  });
}
