import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Zap, User, Building2, Star, Phone, Loader2, Globe, Trash2, MoreVertical } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DraggableKanbanBoard, DraggableItem, KanbanColumn } from "@/components/kanban/DraggableKanbanBoard";
import { usePipeWhatsapp, statusColumns, useUpdatePipeWhatsapp, useDeletePipeWhatsapp, PipeWhatsappStatus } from "@/hooks/usePipeWhatsapp";
import { useCreatePipeConfirmacao } from "@/hooks/usePipeConfirmacao";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useDeleteLead } from "@/hooks/useLeads";
import { useUserRole } from "@/hooks/useUserRole";
import { LeadModal } from "@/components/leads/LeadModal";
import { CreateOpportunityModal } from "@/components/kanban/CreateOpportunityModal";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Origin labels and colors mapping
const originLabels: Record<string, { label: string; color: string }> = {
  calendly: { label: "Calendly", color: "bg-blue-500" },
  whatsapp: { label: "WhatsApp", color: "bg-green-500" },
  meta_ads: { label: "Meta Ads", color: "bg-purple-500" },
  remarketing: { label: "Remarketing", color: "bg-orange-500" },
  base_clientes: { label: "Base Clientes", color: "bg-cyan-500" },
  parceiro: { label: "Parceiro", color: "bg-pink-500" },
  indicacao: { label: "Indicação", color: "bg-yellow-500" },
  quiz: { label: "Quiz", color: "bg-indigo-500" },
  site: { label: "Site", color: "bg-teal-500" },
  organico: { label: "Orgânico", color: "bg-lime-500" },
  outro: { label: "Outro", color: "bg-gray-500" },
};

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
  origin?: string;
}

interface WhatsappCardComponentProps {
  card: WhatsappCard;
  onDelete: (pipeId: string, leadId: string) => void;
  isAdmin: boolean;
}

function WhatsappCardComponent({ card, onDelete, isAdmin }: WhatsappCardComponentProps) {
  const originInfo = originLabels[card.origin || "outro"] || originLabels.outro;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="kanban-card group cursor-pointer relative"
    >
      {/* Actions Menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id, card.leadId);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isAdmin ? "Excluir do Funil + Lead" : "Remover do Funil"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-start justify-between mb-3 pr-6">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {card.name}
          </h4>
          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
            <Building2 className="w-3 h-3" />
            <span className="text-xs truncate">{card.company}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
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

      {/* Origin Badge */}
      <div className="mb-3">
        <Badge 
          variant="outline" 
          className={`text-xs text-white border-0 ${originInfo.color}`}
        >
          <Globe className="w-3 h-3 mr-1" />
          {originInfo.label}
        </Badge>
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
  const [filterOrigin, setFilterOrigin] = useState("all");
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; pipeId: string; leadId: string } | null>(null);
  const { data: pipeData, isLoading, refetch } = usePipeWhatsapp();
  const { data: teamMembers } = useTeamMembers();
  const { data: userRole } = useUserRole();
  const updatePipeWhatsapp = useUpdatePipeWhatsapp();
  const deletePipeWhatsapp = useDeletePipeWhatsapp();
  const deleteLead = useDeleteLead();
  const createPipeConfirmacao = useCreatePipeConfirmacao();

  const isAdmin = userRole?.role === "admin";

  const sdrs = useMemo(() => {
    return teamMembers?.filter(m => m.role === "sdr" && m.is_active) || [];
  }, [teamMembers]);

  // Get unique origins from pipe data
  const availableOrigins = useMemo(() => {
    if (!pipeData) return [];
    const origins = new Set<string>();
    pipeData.forEach(item => {
      if (item.lead?.origin) {
        origins.add(item.lead.origin);
      }
    });
    return Array.from(origins);
  }, [pipeData]);

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
      origin: lead?.origin,
    };
  };

  // Filter function for items
  const filterItems = (item: any) => {
    const lead = item.lead;
    
    // Search filter
    const matchesSearch = searchTerm === "" || 
      lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead?.phone?.includes(searchTerm);
    
    // SDR filter
    const matchesSdr = filterSdr === "all" || item.sdr_id === filterSdr;
    
    // Origin filter
    const matchesOrigin = filterOrigin === "all" || lead?.origin === filterOrigin;
    
    return matchesSearch && matchesSdr && matchesOrigin;
  };

  // Organize data by status columns
  const columns = useMemo((): KanbanColumn<WhatsappCard>[] => {
    if (!pipeData) return statusColumns.map(col => ({ ...col, items: [] }));

    return statusColumns.map(col => {
      const columnItems = pipeData
        .filter(item => item.status === col.id)
        .filter(filterItems)
        .map(transformToCard);

      return {
        ...col,
        items: columnItems,
      };
    });
  }, [pipeData, searchTerm, filterSdr, filterOrigin]);

  // Calculate stats based on FILTERED data
  const stats = useMemo(() => {
    if (!pipeData) return { total: 0, emContato: 0, scheduled: 0, pending: 0 };

    const filteredData = pipeData.filter(filterItems);
    
    const total = filteredData.length;
    const emContato = filteredData.filter(item => item.status === "em_contato").length;
    const scheduled = filteredData.filter(item => item.status === "agendado").length;
    const pending = filteredData.filter(item => item.status === "novo").length;

    return { total, emContato, scheduled, pending };
  }, [pipeData, searchTerm, filterSdr, filterOrigin]);

  // Handle status change from drag-and-drop
  const handleStatusChange = async (itemId: string, newStatus: string) => {
    const item = pipeData?.find(p => p.id === itemId);
    if (!item) return;

    try {
      await updatePipeWhatsapp.mutateAsync({ 
        id: itemId, 
        status: newStatus as PipeWhatsappStatus,
        leadId: item.lead_id,
        sdrId: item.sdr_id,
      });

      // If moved to "agendado", automatically create entry in pipe_confirmacao
      if (newStatus === "agendado") {
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

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog) return;

    try {
      // Always remove from pipe
      await deletePipeWhatsapp.mutateAsync(deleteDialog.pipeId);
      
      // If admin, also delete the lead
      if (isAdmin) {
        await deleteLead.mutateAsync(deleteDialog.leadId);
        toast.success("Lead e oportunidade excluídos com sucesso!");
      } else {
        toast.success("Oportunidade removida do funil!");
      }
      
      setDeleteDialog(null);
    } catch (error: any) {
      if (error.message?.includes("row-level security")) {
        toast.error("Você não tem permissão para excluir leads. Apenas a oportunidade foi removida.");
      } else {
        toast.error("Erro ao excluir");
      }
      console.error(error);
    }
  };

  const handleOpenDeleteDialog = (pipeId: string, leadId: string) => {
    setDeleteDialog({ open: true, pipeId, leadId });
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
            <Zap className="w-6 h-6 text-primary" />
            Funil de Qualificação
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Arraste os cards para alterar o status • Agendado → move para Confirmação
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => { setEditingLead(null); setIsLeadModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
          <Button size="sm" className="gradient-gold" onClick={() => setIsOpportunityModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* Stats Bar - Updated based on filters */}
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
        
        {/* Origin Filter */}
        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-[180px]">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Origens</SelectItem>
            {availableOrigins.map(origin => (
              <SelectItem key={origin} value={origin}>
                {originLabels[origin]?.label || origin}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* SDR Filter */}
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
        renderCard={(card) => (
          <div onClick={() => {
            const item = pipeData?.find(p => p.id === card.id);
            if (item?.lead) {
              setEditingLead(item.lead);
              setIsLeadModalOpen(true);
            }
          }}>
            <WhatsappCardComponent 
              card={card} 
              onDelete={handleOpenDeleteDialog}
              isAdmin={isAdmin}
            />
          </div>
        )}
      />

      {/* Create Opportunity Modal */}
      <CreateOpportunityModal
        open={isOpportunityModalOpen}
        onOpenChange={setIsOpportunityModalOpen}
        onSuccess={() => refetch()}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin 
                ? "Você irá excluir esta oportunidade do funil E o lead associado. Esta ação não pode ser desfeita."
                : "Você irá remover esta oportunidade do funil. O lead será mantido no sistema."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isAdmin ? "Excluir Lead e Oportunidade" : "Remover do Funil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
