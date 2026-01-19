import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCampanha, useCampanhaStages, useCampanhaLeads, useCampanhaMembers, useUpdateCampanhaMember } from "@/hooks/useCampanhas";
import { useCreatePipeConfirmacao } from "@/hooks/usePipeConfirmacao";
import { CampanhaKanban } from "@/components/campanhas/CampanhaKanban";
import { CampanhaAnalytics } from "@/components/campanhas/CampanhaAnalytics";
import { AddLeadToCampanhaModal } from "@/components/campanhas/AddLeadToCampanhaModal";
import { ImportLeadsModal } from "@/components/campanhas/ImportLeadsModal";
import { ArrowLeft, Plus, BarChart3, Kanban, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export default function CampanhaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("kanban");
  const { data: campanha, isLoading: loadingCampanha } = useCampanha(id);
  const { data: stages = [] } = useCampanhaStages(id);
  const { data: leads = [] } = useCampanhaLeads(id);
  const { data: members = [] } = useCampanhaMembers(id);
  const createConfirmacao = useCreatePipeConfirmacao();
  const updateMember = useUpdateCampanhaMember();

  const handleMoveToConfirmacao = async (lead: any) => {
    try {
      // 1. Create or get tag with campaign name
      const tagName = `Campanha: ${campanha?.name}`;
      let tagId: string;

      // Check if tag already exists
      const { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .maybeSingle();

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        // Create new tag with campaign-specific color
        const { data: newTag, error: tagError } = await supabase
          .from("tags")
          .insert({ name: tagName, color: "#8b5cf6" }) // Purple color for campaigns
          .select("id")
          .single();
        
        if (tagError) throw tagError;
        tagId = newTag.id;
      }

      // 2. Associate tag with lead (if not already associated)
      const { data: existingLeadTag } = await supabase
        .from("lead_tags")
        .select("id")
        .eq("lead_id", lead.lead_id)
        .eq("tag_id", tagId)
        .maybeSingle();

      if (!existingLeadTag) {
        await supabase
          .from("lead_tags")
          .insert({ lead_id: lead.lead_id, tag_id: tagId });
      }

      // 3. Create confirmation entry
      await createConfirmacao.mutateAsync({
        lead_id: lead.lead_id,
        sdr_id: lead.sdr_id,
        status: "reuniao_marcada",
        notes: `Campanha: ${campanha?.name}`,
      });

      // 4. Update member meetings count if SDR is a member
      if (lead.sdr_id && campanha?.id) {
        const member = members.find(m => m.team_member_id === lead.sdr_id);
        if (member) {
          const newCount = (member.meetings_count || 0) + 1;
          const shouldEarnBonus = campanha.individual_goal 
            ? newCount >= campanha.individual_goal 
            : false;
          
          await updateMember.mutateAsync({
            campanha_id: campanha.id,
            team_member_id: lead.sdr_id,
            meetings_count: newCount,
            bonus_earned: shouldEarnBonus || member.bonus_earned,
          });
        }
      }

      toast.success("Lead enviado para Confirmação com tag da campanha!");
    } catch (error) {
      console.error("Error moving to confirmação:", error);
      toast.error("Erro ao enviar para Confirmação");
    }
  };

  if (loadingCampanha) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campanha) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campanha não encontrada</p>
        <Button variant="link" onClick={() => navigate("/campanhas")}>
          Voltar para Campanhas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/campanhas")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campanha.name}</h1>
            <p className="text-sm text-muted-foreground">
              Até {format(new Date(campanha.deadline), "dd 'de' MMMM", { locale: ptBR })} • Meta: {campanha.team_goal} reuniões
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar Leads
          </Button>
          <Button onClick={() => setAddLeadOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Lead
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2">
            <Kanban className="w-4 h-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <CampanhaKanban
            campanhaId={id!}
            stages={stages}
            leads={leads}
            onMoveToConfirmacao={handleMoveToConfirmacao}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <CampanhaAnalytics
            campanha={campanha}
            stages={stages}
            leads={leads}
            members={members}
          />
        </TabsContent>
      </Tabs>

      {/* Add Lead Modal */}
      <AddLeadToCampanhaModal
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        campanhaId={id!}
        stages={stages}
        members={members}
        existingLeadIds={leads.map((l) => l.lead_id)}
      />

      {/* Import Leads Modal */}
      <ImportLeadsModal
        open={importOpen}
        onOpenChange={setImportOpen}
        campanhaId={id!}
        stages={stages}
        members={members}
      />
    </div>
  );
}