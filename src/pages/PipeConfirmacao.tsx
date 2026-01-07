import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, Calendar, Loader2, Star, Building2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DraggableKanbanBoard, DraggableItem, KanbanColumn } from "@/components/kanban/DraggableKanbanBoard";
import { usePipeConfirmacao, statusColumns, useUpdatePipeConfirmacao, PipeConfirmacaoStatus, useCreatePipeConfirmacao } from "@/hooks/usePipeConfirmacao";
import { useCreatePipeProposta } from "@/hooks/usePipePropostas";
import { useCreateLead } from "@/hooks/useLeads";
import { LeadModal } from "@/components/leads/LeadModal";
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type OriginFilter = "all" | "calendly" | "whatsapp" | "today" | "week";

interface ConfirmacaoCard extends DraggableItem {
  name: string;
  company: string;
  email?: string;
  phone?: string;
  meetingDate?: string;
  rating: number;
  origin: "calendly" | "whatsapp" | "outro";
  sdr?: string;
  closer?: string;
  tags: string[];
  leadId: string;
}

const originColors = {
  calendly: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  whatsapp: "bg-success/10 text-success border-success/20",
  outro: "bg-muted text-muted-foreground border-border",
};

const originLabels = {
  calendly: "Calendly",
  whatsapp: "WhatsApp",
  outro: "Outro",
};

function ConfirmacaoCardComponent({ card, onClick }: { card: ConfirmacaoCard; onClick?: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="kanban-card group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {card.name}
          </h4>
          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
            <Building2 className="w-3 h-3" />
            <span className="text-xs truncate">{card.company}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 ml-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < card.rating
                  ? "text-primary fill-primary"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {card.meetingDate && (
        <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">{card.meetingDate}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant="outline" className={originColors[card.origin]}>
          {originLabels[card.origin]}
        </Badge>
        {card.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
        {card.tags.length > 2 && (
          <Badge variant="secondary" className="text-xs">
            +{card.tags.length - 2}
          </Badge>
        )}
      </div>

      {(card.sdr || card.closer) && (
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          {card.sdr && (
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">SDR: {card.sdr}</span>
            </div>
          )}
          {card.closer && (
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Closer: {card.closer}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function PipeConfirmacao() {
  const [searchQuery, setSearchQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all");
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  
  const { data: pipeData, isLoading, refetch } = usePipeConfirmacao();
  const updatePipeConfirmacao = useUpdatePipeConfirmacao();
  const createPipeProposta = useCreatePipeProposta();
  const createPipeConfirmacao = useCreatePipeConfirmacao();
  const createLead = useCreateLead();

  // Transform pipe data to Card format
  const transformToCard = (item: any): ConfirmacaoCard => {
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
      rating: lead?.rating || 0,
      origin: lead?.origin || "outro",
      sdr: item.sdr?.name || lead?.sdr?.name,
      closer: item.closer?.name || lead?.closer?.name,
      tags: lead?.lead_tags?.map((lt: any) => lt.tag?.name).filter(Boolean) || [],
      leadId: item.lead_id,
    };
  };

  // Filter and organize data by status columns
  const columns = useMemo((): KanbanColumn<ConfirmacaoCard>[] => {
    if (!pipeData) return statusColumns.map(col => ({ ...col, items: [] }));

    const now = new Date();
    const weekStart = startOfWeek(now, { locale: ptBR });
    const weekEnd = endOfWeek(now, { locale: ptBR });

    return statusColumns.map(col => {
      const columnItems = pipeData
        .filter(item => item.status === col.id)
        .filter(item => {
          const lead = item.lead;
          
          // Search filter
          const matchesSearch = searchQuery === "" || 
            lead?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead?.company?.toLowerCase().includes(searchQuery.toLowerCase());
          
          // Origin filter
          let matchesOrigin = true;
          if (originFilter === "calendly") {
            matchesOrigin = lead?.origin === "calendly";
          } else if (originFilter === "whatsapp") {
            matchesOrigin = lead?.origin === "whatsapp";
          } else if (originFilter === "today" && item.meeting_date) {
            matchesOrigin = isToday(new Date(item.meeting_date));
          } else if (originFilter === "week" && item.meeting_date) {
            matchesOrigin = isWithinInterval(new Date(item.meeting_date), { start: weekStart, end: weekEnd });
          }
          
          return matchesSearch && matchesOrigin;
        })
        .map(transformToCard);

      return {
        ...col,
        items: columnItems,
      };
    });
  }, [pipeData, searchQuery, originFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!pipeData) return { today: 0, confirmed: 0, pending: 0, rate: 0 };

    const todayMeetings = pipeData.filter(item => 
      item.meeting_date && isToday(new Date(item.meeting_date))
    );
    
    const confirmed = pipeData.filter(item => 
      ["confirmada_no_dia", "compareceu"].includes(item.status)
    ).length;
    
    const pending = pipeData.filter(item => 
      ["reuniao_marcada", "confirmar_d3", "confirmar_d1", "pre_confirmada", "confirmacao_no_dia"].includes(item.status)
    ).length;
    
    const total = pipeData.length;
    const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

    return {
      today: todayMeetings.length,
      confirmed,
      pending,
      rate,
    };
  }, [pipeData]);

  // Handle status change from drag-and-drop
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

      // If moved to "compareceu", automatically create entry in pipe_propostas
      if (newStatus === "compareceu") {
        await createPipeProposta.mutateAsync({
          lead_id: item.lead_id,
          closer_id: item.closer_id,
          status: "marcar_compromisso",
        });
        toast.success("Lead movido para Gestão de Propostas automaticamente!");
      } else {
        toast.success("Status atualizado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
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
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm" className="gradient-gold" onClick={() => { setEditingLead(null); setIsLeadModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Reunião
          </Button>
        </div>
      </div>

      {/* Search & Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lead, empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={originFilter === "all" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setOriginFilter("all")}
          >
            Todos
          </Button>
          <Button 
            variant={originFilter === "calendly" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setOriginFilter("calendly")}
          >
            Calendly
          </Button>
          <Button 
            variant={originFilter === "whatsapp" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setOriginFilter("whatsapp")}
          >
            WhatsApp
          </Button>
          <Button 
            variant={originFilter === "today" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setOriginFilter("today")}
          >
            Hoje
          </Button>
          <Button 
            variant={originFilter === "week" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setOriginFilter("week")}
          >
            Esta Semana
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Reuniões Hoje</p>
          <p className="text-2xl font-bold mt-1">{stats.today}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Confirmadas</p>
          <p className="text-2xl font-bold text-success mt-1">{stats.confirmed}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats.pending}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Taxa Confirmação</p>
          <p className="text-2xl font-bold text-primary mt-1">{stats.rate}%</p>
        </div>
      </motion.div>

      {/* Kanban Board with Drag-and-Drop */}
      <DraggableKanbanBoard
        columns={columns}
        onStatusChange={handleStatusChange}
        renderCard={(card) => (
          <ConfirmacaoCardComponent 
            card={card} 
            onClick={() => {
              const item = pipeData?.find(p => p.id === card.id);
              if (item?.lead) {
                setEditingLead(item.lead);
                setIsLeadModalOpen(true);
              }
            }}
          />
        )}
      />

      {/* Lead Modal */}
      <LeadModal
        open={isLeadModalOpen}
        onOpenChange={setIsLeadModalOpen}
        lead={editingLead}
        onSuccess={() => {
          refetch();
          setEditingLead(null);
        }}
      />
    </div>
  );
}
