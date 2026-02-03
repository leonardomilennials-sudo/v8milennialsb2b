import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useUpsellCampanhas, useUpsellClients, UpsellCampanha } from "@/hooks/useUpsell";
import { UpsellFilters } from "./UpsellFilters";
import { UpsellStats } from "./UpsellStats";
import { UpsellKanban } from "./UpsellKanban";
import { CreateCampanhaUpsellModal } from "./CreateCampanhaUpsellModal";
import { UpsellDetailModal } from "./UpsellDetailModal";
import { CampanhaAnalyticsSection } from "./CampanhaAnalyticsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Kanban } from "lucide-react";

export function CampanhasSection() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTipoTempo, setSelectedTipoTempo] = useState("all");
  const [selectedPotencial, setSelectedPotencial] = useState("all");
  const [selectedResponsavel, setSelectedResponsavel] = useState("all");
  const [selectedFaturamento, setSelectedFaturamento] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCampanha, setSelectedCampanha] = useState<UpsellCampanha | null>(null);
  const [view, setView] = useState<"kanban" | "analytics">("kanban");

  const { data: campanhas = [], isLoading: loadingCampanhas } = useUpsellCampanhas(selectedMonth, selectedYear);
  const { data: clients = [] } = useUpsellClients();

  // Filter campanhas
  const filteredCampanhas = campanhas.filter((c) => {
    if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
    if (selectedTipoTempo !== "all" && c.client?.tipo_cliente_tempo !== selectedTipoTempo) return false;
    if (selectedPotencial !== "all" && c.client?.potencial_expansao !== selectedPotencial) return false;
    if (selectedResponsavel !== "all") {
      const matchesResponsavel =
        c.responsavel_fechamento === selectedResponsavel ||
        c.client?.responsavel?.id === selectedResponsavel;
      if (!matchesResponsavel) return false;
    }
    // Filter by faturamento (from the lead associated with the client)
    if (selectedFaturamento !== "all") {
      // Since faturamento comes from the lead, we need to check client's lead data
      // For now, we'll assume client has access to lead faturamento through the relation
      const leadFaturamento = c.client?.lead?.faturamento;
      if (leadFaturamento !== selectedFaturamento) return false;
    }
    // Filter by search query (client name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const clientName = c.client?.nome_cliente?.toLowerCase() || "";
      if (!clientName.includes(query)) return false;
    }
    return true;
  });

  const handleCardClick = (campanha: UpsellCampanha) => {
    setSelectedCampanha(campanha);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <UpsellStats campanhas={campanhas} clients={clients} />

      {/* View Toggle and Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2">
              <Kanban className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Filters */}
      <UpsellFilters
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        selectedStatus={selectedStatus}
        selectedTipoTempo={selectedTipoTempo}
        selectedPotencial={selectedPotencial}
        selectedResponsavel={selectedResponsavel}
        selectedFaturamento={selectedFaturamento}
        searchQuery={searchQuery}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onStatusChange={setSelectedStatus}
        onTipoTempoChange={setSelectedTipoTempo}
        onPotencialChange={setSelectedPotencial}
        onResponsavelChange={setSelectedResponsavel}
        onFaturamentoChange={setSelectedFaturamento}
        onSearchChange={setSearchQuery}
      />

      {/* Content based on view */}
      {view === "kanban" ? (
        loadingCampanhas ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <UpsellKanban campanhas={filteredCampanhas} onCardClick={handleCardClick} />
        )
      ) : (
        <CampanhaAnalyticsSection 
          campanhas={campanhas} 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      )}

      {/* Modals */}
      <CreateCampanhaUpsellModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
      <UpsellDetailModal
        campanha={selectedCampanha}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}
