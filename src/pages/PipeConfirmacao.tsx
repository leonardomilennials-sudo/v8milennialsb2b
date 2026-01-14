import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Loader2, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DraggableKanbanBoard, DraggableItem, KanbanColumn } from "@/components/kanban/DraggableKanbanBoard";
import { usePipeConfirmacao, statusColumns, useUpdatePipeConfirmacao, PipeConfirmacaoStatus } from "@/hooks/usePipeConfirmacao";
import { useCreatePipeProposta } from "@/hooks/usePipePropostas";
import { LeadModal } from "@/components/leads/LeadModal";
import { AddMeetingModal } from "@/components/confirmacao/AddMeetingModal";
import { ConfirmacaoDetailModal } from "@/components/confirmacao/ConfirmacaoDetailModal";
import { ConfirmacaoStats } from "@/components/confirmacao/ConfirmacaoStats";
import { ConfirmacaoCard } from "@/components/confirmacao/ConfirmacaoCard";
import { ConfirmacaoFilters, OriginFilter, TimeFilter, UrgencyFilter } from "@/components/confirmacao/ConfirmacaoFilters";
import { MeetingTimeline } from "@/components/confirmacao/MeetingTimeline";
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval, isTomorrow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ConfirmacaoCardData extends DraggableItem {
  name: string;
  company: string;
  email?: string;
  phone?: string;
  meetingDate?: string;
  meetingDateTime?: Date;
  rating: number;
  origin: "calendly" | "whatsapp" | "meta_ads" | "outro";
  sdr?: string;
  closer?: string;
  tags: string[];
  leadId: string;
  faturamento?: number;
  segment?: string;
  urgency?: string;
  status?: string;
  confirmacaoId?: string;
}

export default function PipeConfirmacao() {
  const [searchQuery, setSearchQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "timeline">("kanban");
  
  const { data: pipeData, isLoading, refetch } = usePipeConfirmacao();
  const updatePipeConfirmacao = useUpdatePipeConfirmacao();
  const createPipeProposta = useCreatePipeProposta();

  const transformToCard = (item: any): ConfirmacaoCardData => {
    const lead = item.lead;
    return {
      id: item.id,
      name: lead?.name || "Sem nome",
      company: lead?.company || "Sem empresa",
      email: lead?.email,
      phone: lead?.phone,
      meetingDate: item.meeting_date 
        ? format(new Date(item.meeting_date), "dd MMM, HH:mm", { locale: ptBR })
        : undefined,
      meetingDateTime: item.meeting_date ? new Date(item.meeting_date) : undefined,
      rating: lead?.rating || 0,
      origin: lead?.origin || "outro",
      sdr: item.sdr?.name || lead?.sdr?.name,
      closer: item.closer?.name || lead?.closer?.name,
      tags: lead?.lead_tags?.map((lt: any) => lt.tag?.name).filter(Boolean) || [],
      leadId: item.lead_id,
      faturamento: lead?.faturamento,
      segment: lead?.segment,
      urgency: lead?.urgency,
      status: item.status,
      confirmacaoId: item.id,
    };
  };

  const columns = useMemo((): KanbanColumn<ConfirmacaoCardData>[] => {
    if (!pipeData) return statusColumns.map(col => ({ ...col, items: [] }));

    const now = new Date();
    const weekStart = startOfWeek(now, { locale: ptBR });
    const weekEnd = endOfWeek(now, { locale: ptBR });

    return statusColumns.map(col => {
      const columnItems = pipeData
        .filter(item => item.status === col.id)
        .filter(item => {
          const lead = item.lead;
          const matchesSearch = searchQuery === "" || 
            lead?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead?.company?.toLowerCase().includes(searchQuery.toLowerCase());
          
          let matchesOrigin = originFilter === "all" || lead?.origin === originFilter;
          
          let matchesUrgency = urgencyFilter === "all" || lead?.urgency === urgencyFilter;
          
          let matchesTime = true;
          if (timeFilter === "today" && item.meeting_date) {
            matchesTime = isToday(new Date(item.meeting_date));
          } else if (timeFilter === "tomorrow" && item.meeting_date) {
            matchesTime = isTomorrow(new Date(item.meeting_date));
          } else if (timeFilter === "week" && item.meeting_date) {
            matchesTime = isWithinInterval(new Date(item.meeting_date), { start: weekStart, end: weekEnd });
          } else if (timeFilter === "overdue" && item.meeting_date) {
            matchesTime = isPast(new Date(item.meeting_date)) && !isToday(new Date(item.meeting_date));
          }

          const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
          
          return matchesSearch && matchesOrigin && matchesUrgency && matchesTime && matchesStatus;
        })
        // Sort by meeting date - closest meetings first
        .sort((a, b) => {
          const dateA = a.meeting_date ? new Date(a.meeting_date).getTime() : Infinity;
          const dateB = b.meeting_date ? new Date(b.meeting_date).getTime() : Infinity;
          return dateA - dateB;
        })
        .map(transformToCard);

      return { ...col, items: columnItems };
    });
  }, [pipeData, searchQuery, originFilter, urgencyFilter, timeFilter, selectedStatuses]);

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    const item = pipeData?.find(p => p.id === itemId);
    if (!item) return;

    try {
      await updatePipeConfirmacao.mutateAsync({ 
        id: itemId, 
        status: newStatus as PipeConfirmacaoStatus,
        leadId: item.lead_id,
        assignedTo: item.sdr_id || item.closer_id,
      });

      if (newStatus === "compareceu") {
        await createPipeProposta.mutateAsync({
          lead_id: item.lead_id,
          closer_id: item.closer_id,
          status: "marcar_compromisso",
        });
        toast.success("Lead movido para Gestão de Propostas!");
      } else {
        toast.success("Status atualizado!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleCardClick = (card: ConfirmacaoCardData) => {
    const item = pipeData?.find(p => p.id === card.id);
    if (item) {
      setSelectedItem(item);
      setIsDetailModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold flex items-center gap-2"
          >
            <Calendar className="w-6 h-6 text-primary" />
            Confirmação de Reunião
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Arraste os cards para alterar o status • Compareceu → move para Propostas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg p-1">
            <Button 
              variant={viewMode === "kanban" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === "timeline" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("timeline")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button size="sm" className="gradient-gold" onClick={() => setIsMeetingModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Reunião
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ConfirmacaoStats data={pipeData || []} />

      {/* Filters */}
      <ConfirmacaoFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        originFilter={originFilter}
        onOriginFilterChange={setOriginFilter}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        urgencyFilter={urgencyFilter}
        onUrgencyFilterChange={setUrgencyFilter}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
        statusOptions={statusColumns}
      />

      {/* Content */}
      {viewMode === "kanban" ? (
        <DraggableKanbanBoard
          columns={columns}
          onStatusChange={handleStatusChange}
          renderCard={(card) => (
            <ConfirmacaoCard 
              card={card} 
              onClick={() => handleCardClick(card)}
            />
          )}
        />
      ) : (
        <MeetingTimeline 
          meetings={pipeData || []} 
          onMeetingClick={(meeting) => {
            setSelectedItem(meeting);
            setIsDetailModalOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <LeadModal
        open={isLeadModalOpen}
        onOpenChange={setIsLeadModalOpen}
        lead={editingLead}
        onSuccess={() => {
          refetch();
          setEditingLead(null);
        }}
      />

      <AddMeetingModal
        open={isMeetingModalOpen}
        onOpenChange={setIsMeetingModalOpen}
        onSuccess={refetch}
      />

      <ConfirmacaoDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        item={selectedItem}
        onSuccess={refetch}
      />
    </div>
  );
}
