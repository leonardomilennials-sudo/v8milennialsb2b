import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type PipeProposta = Tables<"pipe_propostas">;
export type PipePropostaInsert = TablesInsert<"pipe_propostas">;
export type PipePropostaUpdate = TablesUpdate<"pipe_propostas">;

export type PipePropostasStatus =
  | "marcar_compromisso"
  | "compromisso_marcado"
  | "esfriou"
  | "futuro"
  | "vendido"
  | "perdido";

export const statusColumns: { id: PipePropostasStatus; title: string; color: string }[] = [
  { id: "marcar_compromisso", title: "Marcar Compromisso", color: "#F5C518" },
  { id: "compromisso_marcado", title: "Compromisso Marcado", color: "#3B82F6" },
  { id: "esfriou", title: "Esfriou", color: "#94A3B8" },
  { id: "futuro", title: "Futuro", color: "#8B5CF6" },
  { id: "vendido", title: "Vendido ✓", color: "#22C55E" },
  { id: "perdido", title: "Perdido", color: "#EF4444" },
];

export function usePipePropostas() {
  return useQuery({
    queryKey: ["pipe_propostas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipe_propostas")
        .select(`
          *,
          lead:leads(
            id, name, company, email, phone, rating, origin, segment, faturamento,
            sdr:team_members!leads_sdr_id_fkey(id, name),
            closer:team_members!leads_closer_id_fkey(id, name),
            lead_tags(tag:tags(id, name, color))
          ),
          closer:team_members!pipe_propostas_closer_id_fkey(id, name)
        `)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePipeProposta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: PipePropostaInsert) => {
      const { data, error } = await supabase
        .from("pipe_propostas")
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipe_propostas"] });
    },
  });
}

export function useUpdatePipeProposta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: PipePropostaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("pipe_propostas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipe_propostas"] });
    },
  });
}
