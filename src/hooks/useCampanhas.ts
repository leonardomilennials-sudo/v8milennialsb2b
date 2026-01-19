import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export interface Campanha {
  id: string;
  name: string;
  description: string | null;
  deadline: string;
  team_goal: number;
  individual_goal: number | null;
  bonus_value: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampanhaStage {
  id: string;
  campanha_id: string;
  name: string;
  color: string | null;
  position: number;
  is_reuniao_marcada: boolean;
  created_at: string;
}

export interface CampanhaMember {
  id: string;
  campanha_id: string;
  team_member_id: string;
  meetings_count: number;
  bonus_earned: boolean;
  created_at: string;
  team_member?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface CampanhaLead {
  id: string;
  campanha_id: string;
  lead_id: string;
  stage_id: string;
  sdr_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead?: {
    id: string;
    name: string;
    company: string | null;
    phone: string | null;
    email: string | null;
    faturamento: string | null;
    segment: string | null;
    rating: number | null;
    origin: string;
    notes: string | null;
    closer_id: string | null;
    closer?: {
      id: string;
      name: string;
    };
    lead_tags?: Array<{
      tag: {
        id: string;
        name: string;
        color: string | null;
      };
    }>;
  };
  sdr?: {
    id: string;
    name: string;
  };
  stage?: CampanhaStage;
}

export interface CampanhaInsert {
  name: string;
  description?: string | null;
  deadline: string;
  team_goal: number;
  individual_goal?: number | null;
  bonus_value?: number | null;
}

export interface CampanhaStageInsert {
  campanha_id: string;
  name: string;
  color?: string;
  position: number;
  is_reuniao_marcada?: boolean;
}

// Hook to fetch all campaigns
export function useCampanhas() {
  return useQuery({
    queryKey: ["campanhas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Campanha[];
    },
  });
}

// Hook to fetch a single campaign with all related data
export function useCampanha(id: string | undefined) {
  return useQuery({
    queryKey: ["campanha", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("campanhas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Campanha;
    },
    enabled: !!id,
  });
}

// Hook to fetch campaign stages
export function useCampanhaStages(campanhaId: string | undefined) {
  return useQuery({
    queryKey: ["campanha_stages", campanhaId],
    queryFn: async () => {
      if (!campanhaId) return [];

      const { data, error } = await supabase
        .from("campanha_stages")
        .select("*")
        .eq("campanha_id", campanhaId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as CampanhaStage[];
    },
    enabled: !!campanhaId,
  });
}

// Hook to fetch campaign members
export function useCampanhaMembers(campanhaId: string | undefined) {
  return useQuery({
    queryKey: ["campanha_members", campanhaId],
    queryFn: async () => {
      if (!campanhaId) return [];

      const { data, error } = await supabase
        .from("campanha_members")
        .select(`
          *,
          team_member:team_members(id, name, role)
        `)
        .eq("campanha_id", campanhaId);

      if (error) throw error;
      return data as CampanhaMember[];
    },
    enabled: !!campanhaId,
  });
}

// Hook to fetch campaign leads
export function useCampanhaLeads(campanhaId: string | undefined) {
  useRealtimeSubscription("campanha_leads", ["campanha_leads"]);
  return useQuery({
    queryKey: ["campanha_leads", campanhaId],
    queryFn: async () => {
      if (!campanhaId) return [];

      const { data, error } = await supabase
        .from("campanha_leads")
        .select(`
          *,
          lead:leads(
            id, name, company, phone, email, faturamento, segment, rating, origin, notes, closer_id,
            closer:team_members!leads_closer_id_fkey(id, name),
            lead_tags(tag:tags(id, name, color))
          ),
          sdr:team_members!campanha_leads_sdr_id_fkey(id, name),
          stage:campanha_stages(*)
        `)
        .eq("campanha_id", campanhaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CampanhaLead[];
    },
    enabled: !!campanhaId,
  });
}

// Hook to create a campaign with default stages
export function useCreateCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campanha: CampanhaInsert & { stages: Omit<CampanhaStageInsert, "campanha_id">[]; memberIds: string[] }) => {
      // Create the campaign
      const { data: newCampanha, error: campanhaError } = await supabase
        .from("campanhas")
        .insert({
          name: campanha.name,
          description: campanha.description,
          deadline: campanha.deadline,
          team_goal: campanha.team_goal,
          individual_goal: campanha.individual_goal,
          bonus_value: campanha.bonus_value,
        })
        .select()
        .single();

      if (campanhaError) throw campanhaError;

      // Create stages
      if (campanha.stages.length > 0) {
        const stagesWithCampanhaId = campanha.stages.map((stage) => ({
          ...stage,
          campanha_id: newCampanha.id,
        }));

        const { error: stagesError } = await supabase
          .from("campanha_stages")
          .insert(stagesWithCampanhaId);

        if (stagesError) throw stagesError;
      }

      // Add members
      if (campanha.memberIds.length > 0) {
        const members = campanha.memberIds.map((memberId) => ({
          campanha_id: newCampanha.id,
          team_member_id: memberId,
        }));

        const { error: membersError } = await supabase
          .from("campanha_members")
          .insert(members);

        if (membersError) throw membersError;
      }

      return newCampanha;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
    },
  });
}

// Hook to update a campaign
export function useUpdateCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campanha> & { id: string }) => {
      const { data, error } = await supabase
        .from("campanhas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
      queryClient.invalidateQueries({ queryKey: ["campanha", variables.id] });
    },
  });
}

// Hook to delete a campaign
export function useDeleteCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("campanhas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
    },
  });
}

// Hook to add a lead to a campaign
export function useAddCampanhaLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { campanha_id: string; lead_id: string; stage_id: string; sdr_id?: string }) => {
      const { data: newLead, error } = await supabase
        .from("campanha_leads")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return newLead;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campanha_leads", variables.campanha_id] });
    },
  });
}

// Hook to update a campaign lead (move between stages)
export function useUpdateCampanhaLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campanha_id, ...updates }: { id: string; campanha_id: string; stage_id?: string; sdr_id?: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("campanha_leads")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          stage:campanha_stages(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campanha_leads", variables.campanha_id] });
      queryClient.invalidateQueries({ queryKey: ["campanha_members", variables.campanha_id] });
    },
  });
}

// Hook to delete a campaign lead
export function useDeleteCampanhaLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campanha_id }: { id: string; campanha_id: string }) => {
      const { error } = await supabase
        .from("campanha_leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campanha_leads", variables.campanha_id] });
    },
  });
}

// Hook to update member meetings count
export function useUpdateCampanhaMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campanha_id, team_member_id, meetings_count, bonus_earned }: { campanha_id: string; team_member_id: string; meetings_count?: number; bonus_earned?: boolean }) => {
      const { data, error } = await supabase
        .from("campanha_members")
        .update({ meetings_count, bonus_earned })
        .eq("campanha_id", campanha_id)
        .eq("team_member_id", team_member_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campanha_members", variables.campanha_id] });
    },
  });
}
