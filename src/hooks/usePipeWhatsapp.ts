import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { triggerFollowUpAutomation } from "./useAutoFollowUp";

export type PipeWhatsapp = Tables<"pipe_whatsapp">;
export type PipeWhatsappInsert = TablesInsert<"pipe_whatsapp">;
export type PipeWhatsappUpdate = TablesUpdate<"pipe_whatsapp">;

// Using database enum values
export type PipeWhatsappStatus = "novo" | "em_contato" | "agendado" | "compareceu";

export const statusColumns: { id: PipeWhatsappStatus; title: string; color: string }[] = [
  { id: "novo", title: "Novo", color: "#6366f1" },
  { id: "em_contato", title: "Em Contato", color: "#f59e0b" },
  { id: "agendado", title: "Agendado ✓", color: "#22c55e" },
  { id: "compareceu", title: "Compareceu ✓", color: "#16a34a" },
];

export function usePipeWhatsapp() {
  return useQuery({
    queryKey: ["pipe_whatsapp"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipe_whatsapp")
        .select(`
          *,
          lead:leads(
            id, name, company, email, phone, rating, origin, segment, faturamento,
            sdr:team_members!leads_sdr_id_fkey(id, name),
            lead_tags(tag:tags(id, name, color))
          ),
          sdr:team_members!pipe_whatsapp_sdr_id_fkey(id, name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePipeWhatsapp() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: PipeWhatsappInsert) => {
      const { data, error } = await supabase
        .from("pipe_whatsapp")
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;

      // Trigger automation for the initial status
      await triggerFollowUpAutomation({
        leadId: data.lead_id,
        assignedTo: data.sdr_id,
        pipeType: "whatsapp",
        stage: data.status,
        sourcePipeId: data.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipe_whatsapp"] });
      queryClient.invalidateQueries({ queryKey: ["follow_ups"] });
    },
  });
}

export function useUpdatePipeWhatsapp() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, leadId, sdrId, ...updates }: PipeWhatsappUpdate & { id: string; leadId?: string; sdrId?: string | null }) => {
      const { data, error } = await supabase
        .from("pipe_whatsapp")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // Trigger automation if status changed
      if (updates.status && leadId) {
        await triggerFollowUpAutomation({
          leadId: leadId,
          assignedTo: sdrId || data.sdr_id,
          pipeType: "whatsapp",
          stage: updates.status,
          sourcePipeId: data.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipe_whatsapp"] });
      queryClient.invalidateQueries({ queryKey: ["follow_ups"] });
    },
  });
}
