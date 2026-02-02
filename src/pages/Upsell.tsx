import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import { useUpsellCampanhas, useUpsellClients, UpsellCampanha } from "@/hooks/useUpsell";
import { UpsellFilters } from "@/components/upsell/UpsellFilters";
import { UpsellStats } from "@/components/upsell/UpsellStats";
import { UpsellKanban } from "@/components/upsell/UpsellKanban";
import { CreateUpsellModal } from "@/components/upsell/CreateUpsellModal";
import { UpsellDetailModal } from "@/components/upsell/UpsellDetailModal";

export default function Upsell() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTipoTempo, setSelectedTipoTempo] = useState("all");
  const [selectedPotencial, setSelectedPotencial] = useState("all");
  const [selectedResponsavel, setSelectedResponsavel] = useState("all");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCampanha, setSelectedCampanha] = useState<UpsellCampanha | null>(null);

  const { data: campanhas = [], isLoading: loadingCampanhas } = useUpsellCampanhas(selectedMonth, selectedYear);
  const { data: clients = [], isLoading: loadingClients } = useUpsellClients();

  // Filter campanhas
  const filteredCampanhas = campanhas.filter((c) => {
    if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
    if (selectedTipoTempo !== "all" && c.client?.tipo_cliente_tempo !== selectedTipoTempo) return false;
    if (selectedPotencial !== "all" && c.client?.potencial_expansao !== selectedPotencial) return false;
    if (selectedResponsavel !== "all") {
      const matchesResponsavel = 
        c.responsavel_fechamento === selectedResponsavel || 
        c.client?.responsavel_interno === selectedResponsavel;
      if (!matchesResponsavel) return false;
    }
    return true;
  });

  const handleCardClick = (campanha: UpsellCampanha) => {
    setSelectedCampanha(campanha);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Upsell
          </h1>
          <p className="text-muted-foreground">
            Gestão estratégica de expansão de receita da base ativa
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Upsell
        </Button>
      </div>

      {/* Stats */}
      <UpsellStats campanhas={campanhas} clients={clients} />

      {/* Filters */}
      <UpsellFilters
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        selectedStatus={selectedStatus}
        selectedTipoTempo={selectedTipoTempo}
        selectedPotencial={selectedPotencial}
        selectedResponsavel={selectedResponsavel}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onStatusChange={setSelectedStatus}
        onTipoTempoChange={setSelectedTipoTempo}
        onPotencialChange={setSelectedPotencial}
        onResponsavelChange={setSelectedResponsavel}
      />

      {/* Kanban */}
      {loadingCampanhas ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <UpsellKanban campanhas={filteredCampanhas} onCardClick={handleCardClick} />
      )}

      {/* Modals */}
      <CreateUpsellModal
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
