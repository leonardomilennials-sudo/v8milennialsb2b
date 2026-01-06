import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, MessageCircle, User, Building2, Star, Phone, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DraggableKanbanBoard, DraggableItem, KanbanColumn } from "@/components/kanban/DraggableKanbanBoard";
import { usePipeWhatsapp, statusColumns, useUpdatePipeWhatsapp, PipeWhatsappStatus } from "@/hooks/usePipeWhatsapp";
import { usePipeConfirmacao, useCreatePipeConfirmacao } from "@/hooks/usePipeConfirmacao";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface WhatsappCard extends DraggableItem {
  name: string;
  company: string;
  phone?: string;
  rating: number;
  sdr?: string;
  sdrId?: string;
  tags: string[];
  scheduledDate?: string;
  createdAt: string;
  segment?: string;
  leadId: string;
  closerId?: string;
}

function WhatsappCardComponent({ card }: { card: WhatsappCard }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="kanban-card group cursor-pointer"
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

      {/* Phone */}
      {card.phone && (
        <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
          <Phone className="w-3.5 h-3.5" />
          <span className="text-xs">{card.phone}</span>
        </div>
      )}

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
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
      )}

      {/* SDR & Time */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(card.createdAt), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
        {card.sdr && (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{card.sdr}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function PipeWhatsapp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSdr, setFilterSdr] = useState("all");

  const { data: pipeData, isLoading } = usePipeWhatsapp();
  const { data: teamMembers } = useTeamMembers();
  const updatePipeWhatsapp = useUpdatePipeWhatsapp();
  const createPipeConfirmacao = useCreatePipeConfirmacao();

  const sdrs = useMemo(() => {
    return teamMembers?.filter(m => m.role === "sdr" && m.is_active) || [];
  }, [teamMembers]);

  // Transform pipe data to WhatsappCard format
  const transformToCard = (item: any): WhatsappCard => {
    const lead = item.lead;
    return {
      id: item.id,
      name: lead?.name || "Sem nome",
      company: lead?.company || "Sem empresa",
      phone: lead?.phone,
      rating: lead?.rating || 0,
      sdr: item.sdr?.name || lead?.sdr?.name,
      sdrId: item.sdr_id,
      tags: lead?.lead_tags?.map((lt: any) => lt.tag?.name).filter(Boolean) || [],
      scheduledDate: item.scheduled_date,
      createdAt: item.created_at,
      segment: lead?.segment,
      leadId: item.lead_id,
      closerId: lead?.closer_id,
    };
  };

  // Organize data by status columns
  const columns = useMemo((): KanbanColumn<WhatsappCard>[] => {
    if (!pipeData) return statusColumns.map(col => ({ ...col, items: [] }));

    return statusColumns.map(col => {
      const columnItems = pipeData
        .filter(item => item.status === col.id)
        .filter(item => {
          const lead = item.lead;
          
          // Search filter
          const matchesSearch = searchTerm === "" || 
            lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead?.phone?.includes(searchTerm);
          
          // SDR filter
          const matchesSdr = filterSdr === "all" || item.sdr_id === filterSdr;
          
          return matchesSearch && matchesSdr;
        })
        .map(transformToCard);

      return {
        ...col,
        items: columnItems,
      };
    });
  }, [pipeData, searchTerm, filterSdr]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!pipeData) return { total: 0, emContato: 0, scheduled: 0, pending: 0 };

    const total = pipeData.length;
    const emContato = pipeData.filter(item => item.status === "em_contato").length;
    const scheduled = pipeData.filter(item => item.status === "agendado").length;
    const pending = pipeData.filter(item => item.status === "novo").length;

    return { total, emContato, scheduled, pending };
  }, [pipeData]);

  // Handle status change from drag-and-drop
  const handleStatusChange = async (itemId: string, newStatus: string) => {
    const item = pipeData?.find(p => p.id === itemId);
    if (!item) return;

    try {
      await updatePipeWhatsapp.mutateAsync({ 
        id: itemId, 
        status: newStatus as PipeWhatsappStatus 
      });

      // If moved to "compareceu", automatically create entry in pipe_confirmacao
      if (newStatus === "compareceu") {
        await createPipeConfirmacao.mutateAsync({
          lead_id: item.lead_id,
          sdr_id: item.sdr_id,
          status: "reuniao_marcada",
          meeting_date: item.scheduled_date,
        });
        toast.success("Lead movido para Confirmação de Reunião automaticamente!");
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
            <MessageCircle className="w-6 h-6 text-success" />
            Leads WhatsApp (SDR)
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Arraste os cards para alterar o status • Compareceu → move para Confirmação
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm" className="gradient-gold">
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
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
          <p className="text-sm text-muted-foreground">Total Leads</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Em Contato</p>
          <p className="text-2xl font-bold text-success mt-1">{stats.emContato}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Agendados</p>
          <p className="text-2xl font-bold text-primary mt-1">{stats.scheduled}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats.pending}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lead, empresa, telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterSdr} onValueChange={setFilterSdr}>
          <SelectTrigger className="w-[180px]">
            <User className="w-4 h-4 mr-2" />
            <SelectValue placeholder="SDR" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos SDRs</SelectItem>
            {sdrs.map(sdr => (
              <SelectItem key={sdr.id} value={sdr.id}>{sdr.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board with Drag-and-Drop */}
      <DraggableKanbanBoard
        columns={columns}
        onStatusChange={handleStatusChange}
        renderCard={(card) => <WhatsappCardComponent card={card} />}
      />
    </div>
  );
}
