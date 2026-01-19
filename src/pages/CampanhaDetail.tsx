import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCampanha, useCampanhaStages, useCampanhaLeads, useCampanhaMembers } from "@/hooks/useCampanhas";
import { useCreatePipeConfirmacao } from "@/hooks/usePipeConfirmacao";
import { CampanhaKanban } from "@/components/campanhas/CampanhaKanban";
import { CampanhaAnalytics } from "@/components/campanhas/CampanhaAnalytics";
import { AddLeadToCampanhaModal } from "@/components/campanhas/AddLeadToCampanhaModal";
import { ArrowLeft, Plus, BarChart3, Kanban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CampanhaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("kanban");

  const { data: campanha, isLoading: loadingCampanha } = useCampanha(id);
  const { data: stages = [] } = useCampanhaStages(id);
  const { data: leads = [] } = useCampanhaLeads(id);
  const { data: members = [] } = useCampanhaMembers(id);
  const createConfirmacao = useCreatePipeConfirmacao();

  const handleMoveToConfirmacao = async (lead: any) => {
    try {
      await createConfirmacao.mutateAsync({
        lead_id: lead.lead_id,
        sdr_id: lead.sdr_id,
        status: "reuniao_marcada",
        notes: `Campanha: ${campanha?.name}`,
      });
      toast.success("Lead enviado para Confirmação!");
    } catch (error) {
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
        
        <Button onClick={() => setAddLeadOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Lead
        </Button>
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
    </div>
  );
}