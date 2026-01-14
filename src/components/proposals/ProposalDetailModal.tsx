import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, DollarSign, Package, User, Building2, 
  Star, Phone, Mail, Tag, History, FileText, TrendingUp, 
  ArrowRight, CheckCircle2, XCircle, AlertCircle, MessageSquare,
  Loader2, Plus, Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUpdatePipeProposta, useDeletePipeProposta, PipePropostasStatus, statusColumns } from "@/hooks/usePipePropostas";
import { useLeadHistory, useCreateLeadHistory } from "@/hooks/useLeadHistory";
import { useDeleteLead } from "@/hooks/useLeads";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusLabels: Record<PipePropostasStatus, string> = {
  marcar_compromisso: "Marcar Compromisso",
  compromisso_marcado: "Compromisso Marcado",
  esfriou: "Esfriou",
  futuro: "Futuro",
  vendido: "Vendido ✓",
  perdido: "Perdido",
};

const statusIcons: Record<PipePropostasStatus, React.ReactNode> = {
  marcar_compromisso: <Calendar className="w-4 h-4" />,
  compromisso_marcado: <CheckCircle2 className="w-4 h-4" />,
  esfriou: <AlertCircle className="w-4 h-4" />,
  futuro: <Clock className="w-4 h-4" />,
  vendido: <TrendingUp className="w-4 h-4" />,
  perdido: <XCircle className="w-4 h-4" />,
};

interface ProposalDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposta: any;
  onSuccess?: () => void;
}

export function ProposalDetailModal({ 
  open, 
  onOpenChange, 
  proposta,
  onSuccess
}: ProposalDetailModalProps) {
  const [formData, setFormData] = useState({
    status: proposta?.status || "marcar_compromisso",
    product_type: proposta?.product_type || "",
    sale_value: proposta?.sale_value || "",
    contract_duration: proposta?.contract_duration || "",
    closer_id: proposta?.closer_id || "",
    commitment_date: proposta?.commitment_date 
      ? format(new Date(proposta.commitment_date), "yyyy-MM-dd'T'HH:mm")
      : "",
    notes: proposta?.notes || "",
  });
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const { data: teamMembers = [] } = useTeamMembers();
  const updateProposta = useUpdatePipeProposta();
  const deleteProposta = useDeletePipeProposta();
  const deleteLead = useDeleteLead();
  const { data: leadHistory, isLoading: historyLoading } = useLeadHistory(proposta?.lead_id);
  const createLeadHistory = useCreateLeadHistory();

  const closers = teamMembers.filter(m => m.role === "closer" && m.is_active);
  useEffect(() => {
    if (proposta) {
      setFormData({
        status: proposta.status || "marcar_compromisso",
        product_type: proposta.product_type || "",
        sale_value: proposta.sale_value || "",
        contract_duration: proposta.contract_duration || "",
        closer_id: proposta.closer_id || "",
        commitment_date: proposta.commitment_date 
          ? format(new Date(proposta.commitment_date), "yyyy-MM-dd'T'HH:mm")
          : "",
        notes: proposta.notes || "",
      });
    }
  }, [proposta]);

  const handleSubmit = async () => {
    if (!formData.product_type) {
      toast.error("Tipo de produto é obrigatório");
      return;
    }

    if (!formData.sale_value) {
      toast.error("Valor da venda é obrigatório");
      return;
    }

    if (!formData.closer_id) {
      toast.error("Closer responsável é obrigatório");
      return;
    }

    try {
      // Add history entries for significant changes
      if (formData.status !== proposta.status) {
        const newStatusLabel = statusColumns.find(s => s.id === formData.status)?.title;
        await createLeadHistory.mutateAsync({
          lead_id: proposta.lead_id,
          action: "Status da proposta alterado",
          description: `Status alterado para "${newStatusLabel}"`,
        });
      }

      if (formData.notes !== proposta.notes && formData.notes) {
        await createLeadHistory.mutateAsync({
          lead_id: proposta.lead_id,
          action: "Observação da proposta atualizada",
          description: formData.notes,
        });
      }

      await updateProposta.mutateAsync({
        id: proposta.id,
        status: formData.status as PipePropostasStatus,
        product_type: formData.product_type as "mrr" | "projeto",
        sale_value: Number(formData.sale_value),
        contract_duration: formData.contract_duration ? Number(formData.contract_duration) : null,
        closer_id: formData.closer_id,
        commitment_date: formData.commitment_date ? new Date(formData.commitment_date).toISOString() : null,
        notes: formData.notes || null,
        closed_at: formData.status === "vendido" ? new Date().toISOString() : 
                  formData.status === "perdido" ? new Date().toISOString() : null,
      });
      
      if (formData.status === "vendido" && proposta.status !== "vendido") {
        toast.success("🎉 Venda fechada com sucesso!");
      } else {
        toast.success("Proposta atualizada!");
      }
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao atualizar proposta");
      console.error(error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setIsAddingNote(true);
    try {
      await createLeadHistory.mutateAsync({
        lead_id: proposta.lead_id,
        action: "Nota adicionada na proposta",
        description: newNote,
      });
      
      // Also update the proposta notes
      const updatedNotes = formData.notes 
        ? `${formData.notes}\n\n[${format(new Date(), "dd/MM/yyyy HH:mm")}] ${newNote}`
        : newNote;
      
      await updateProposta.mutateAsync({
        id: proposta.id,
        notes: updatedNotes,
      });

      setFormData({ ...formData, notes: updatedNotes });
      toast.success("Nota adicionada!");
      setNewNote("");
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao adicionar nota");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteProposta = async () => {
    try {
      await deleteProposta.mutateAsync(proposta.id);
      toast.success("Proposta excluída!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao excluir proposta");
      console.error(error);
    }
  };

  const handleDeleteLead = async () => {
    try {
      await deleteLead.mutateAsync(proposta.lead_id);
      toast.success("Lead e proposta excluídos!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao excluir lead");
      console.error(error);
    }
  };

  const lead = proposta?.lead;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: PipePropostasStatus) => {
    const col = statusColumns.find(c => c.id === status);
    return col?.color || "#888";
  };

  const totalContractValue = formData.product_type === "mrr" && formData.sale_value && formData.contract_duration
    ? Number(formData.sale_value) * Number(formData.contract_duration)
    : formData.sale_value ? Number(formData.sale_value) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Detalhes da Proposta
            </DialogTitle>
            <Badge
              variant="outline"
              style={{ 
                backgroundColor: `${getStatusColor(formData.status as PipePropostasStatus)}15`,
                borderColor: `${getStatusColor(formData.status as PipePropostasStatus)}40`,
                color: getStatusColor(formData.status as PipePropostasStatus)
              }}
              className="font-medium"
            >
              {statusIcons[formData.status as PipePropostasStatus]}
              <span className="ml-1">{statusLabels[formData.status as PipePropostasStatus]}</span>
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="gap-1.5">
              <FileText className="w-4 h-4" />
              Proposta
            </TabsTrigger>
            <TabsTrigger value="lead" className="gap-1.5">
              <User className="w-4 h-4" />
              Lead
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="details" className="m-0 space-y-4">
              {/* Value Summary Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valor da Proposta</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {formatCurrency(Number(formData.sale_value) || 0)}
                      </span>
                      {formData.product_type === "mrr" && (
                        <span className="text-muted-foreground">/mês</span>
                      )}
                    </div>
                    {formData.product_type === "mrr" && formData.contract_duration && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Total do contrato: {formatCurrency(totalContractValue)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {formData.product_type && (
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "text-sm",
                          formData.product_type === "mrr" 
                            ? "bg-chart-5/10 text-chart-5 border-chart-5/20" 
                            : "bg-primary/10 text-primary border-primary/20"
                        )}
                      >
                        {formData.product_type === "mrr" ? "MRR" : "Projeto"}
                      </Badge>
                    )}
                    {formData.contract_duration && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {formData.contract_duration} meses
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Commitment Date - Highlighted */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <Label htmlFor="commitment_date" className="text-base font-semibold">Data da Reunião</Label>
                    <p className="text-xs text-muted-foreground">Quando será o compromisso com o lead</p>
                  </div>
                </div>
                <Input
                  id="commitment_date"
                  type="datetime-local"
                  value={formData.commitment_date}
                  onChange={(e) => setFormData({ ...formData, commitment_date: e.target.value })}
                  className="bg-background"
                />
                {formData.commitment_date && (
                  <p className="text-sm text-blue-500 mt-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(formData.commitment_date), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </motion.div>

              {/* Status Selection */}
              <div className="grid gap-2">
                <Label>Status da Proposta</Label>
                <div className="grid grid-cols-3 gap-2">
                  {statusColumns.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => setFormData({ ...formData, status: status.id })}
                      className={cn(
                        "p-3 rounded-lg border-2 text-left transition-all",
                        "hover:border-primary/50",
                        formData.status === status.id 
                          ? "border-primary bg-primary/5" 
                          : "border-muted"
                      )}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mb-2"
                        style={{ backgroundColor: status.color }}
                      />
                      <p className="text-xs font-medium">{status.title}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo de Produto *</Label>
                  <Select
                    value={formData.product_type || "none"}
                    onValueChange={(v) => setFormData({ ...formData, product_type: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      <SelectItem value="mrr">MRR (Recorrente)</SelectItem>
                      <SelectItem value="projeto">Projeto (Único)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Closer Responsável *</Label>
                  <Select
                    value={formData.closer_id || "none"}
                    onValueChange={(v) => setFormData({ ...formData, closer_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {closers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sale_value">Valor da Venda (R$) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="sale_value"
                      type="number"
                      value={formData.sale_value}
                      onChange={(e) => setFormData({ ...formData, sale_value: e.target.value })}
                      placeholder="10000"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duração (meses)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="duration"
                      type="number"
                      value={formData.contract_duration}
                      onChange={(e) => setFormData({ ...formData, contract_duration: e.target.value })}
                      placeholder="12"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>


              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anotações sobre a proposta..."
                  rows={3}
                />
              </div>

              {/* Quick Add Note */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Adicionar nota rápida</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adicionar uma nota ao histórico..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddNote} 
                    disabled={!newNote.trim() || isAddingNote}
                    className="self-end"
                  >
                    {isAddingNote ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lead" className="m-0 space-y-4">
              {lead ? (
                <>
                  {/* Lead Header */}
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{lead.name}</h3>
                        {lead.company && (
                          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span>{lead.company}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(10)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3.5 h-3.5",
                              i < (lead.rating || 0)
                                ? "text-chart-5 fill-chart-5"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    {lead.email && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border">
                        <Mail className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">{lead.email}</p>
                        </div>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border">
                        <Phone className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Telefone</p>
                          <p className="text-sm font-medium">{lead.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lead Details */}
                  <div className="grid grid-cols-2 gap-4">
                    {lead.segment && (
                      <div className="p-3 rounded-lg border">
                        <p className="text-xs text-muted-foreground">Segmento</p>
                        <p className="text-sm font-medium">{lead.segment}</p>
                      </div>
                    )}
                    {lead.faturamento && (
                      <div className="p-3 rounded-lg border">
                        <p className="text-xs text-muted-foreground">Faturamento</p>
                        <p className="text-sm font-medium">{formatCurrency(lead.faturamento)}</p>
                      </div>
                    )}
                  </div>

                  {/* Team */}
                  <div className="grid grid-cols-2 gap-4">
                    {lead.sdr && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border">
                        <User className="w-4 h-4 text-chart-5" />
                        <div>
                          <p className="text-xs text-muted-foreground">SDR</p>
                          <p className="text-sm font-medium">{lead.sdr.name}</p>
                        </div>
                      </div>
                    )}
                    {lead.closer && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border">
                        <User className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Closer</p>
                          <p className="text-sm font-medium">{lead.closer.name}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {lead.lead_tags?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {lead.lead_tags.map((lt: any) => (
                          <Badge
                            key={lt.tag?.id}
                            variant="outline"
                            style={{ 
                              backgroundColor: `${lt.tag?.color}20`,
                              borderColor: `${lt.tag?.color}40`,
                              color: lt.tag?.color
                            }}
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {lt.tag?.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {lead.notes && (
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Observações do Lead</p>
                      <p className="text-sm">{lead.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Lead não encontrado
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="m-0 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Linha do Tempo</h3>
                {leadHistory && leadHistory.length > 0 && (
                  <Badge variant="secondary">{leadHistory.length + 1} eventos</Badge>
                )}
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  
                  {/* Proposta criada */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative pl-10 pb-4"
                  >
                    <div className="absolute left-2 w-5 h-5 rounded-full border-2 border-background bg-primary flex items-center justify-center">
                      <Package className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-medium">Proposta criada</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {proposta?.created_at && format(new Date(proposta.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        <span className="mx-2">•</span>
                        {proposta?.created_at && formatDistanceToNow(new Date(proposta.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </motion.div>

                  {/* Lead history events */}
                  {leadHistory?.slice().reverse().map((event, idx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (idx + 1) * 0.05 }}
                      className="relative pl-10 pb-4"
                    >
                      <div className={cn(
                        "absolute left-2 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center",
                        event.action.includes("Status") ? "bg-chart-2" : "bg-chart-3"
                      )}>
                        {event.action.includes("Status") ? (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        ) : (
                          <MessageSquare className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-medium">{event.action}</p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          <span className="mx-2">•</span>
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Compromisso agendado */}
                  {proposta?.commitment_date && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative pl-10 pb-4"
                    >
                      <div className="absolute left-2 w-5 h-5 rounded-full border-2 border-background bg-chart-5 flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-medium">Compromisso agendado</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(proposta.commitment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Venda fechada / Perdida */}
                  {proposta?.closed_at && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative pl-10 pb-4"
                    >
                      <div className={cn(
                        "absolute left-2 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center",
                        proposta.status === "vendido" ? "bg-success" : "bg-destructive"
                      )}>
                        {proposta.status === "vendido" 
                          ? <CheckCircle2 className="w-3 h-3 text-white" />
                          : <XCircle className="w-3 h-3 text-white" />
                        }
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-medium">
                          {proposta.status === "vendido" ? "🎉 Venda fechada!" : "Proposta perdida"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(proposta.closed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-between gap-2 pt-4 border-t mt-4">
          <div className="flex gap-2">
            {/* Excluir apenas proposta */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir Proposta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá remover apenas a proposta. O lead continuará no sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteProposta}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteProposta.isPending ? "Excluindo..." : "Excluir Proposta"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Excluir lead e proposta */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir Lead
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir lead e todas as propostas?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá remover permanentemente o lead "{lead?.name}" e TODOS os dados associados (propostas, follow-ups, histórico, etc).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteLead}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteLead.isPending ? "Excluindo..." : "Excluir Lead"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={updateProposta.isPending}
              className={cn(
                formData.status === "vendido" && proposta?.status !== "vendido" && "bg-success hover:bg-success/90"
              )}
            >
              {updateProposta.isPending ? "Salvando..." : 
               formData.status === "vendido" && proposta?.status !== "vendido" ? "Fechar Venda 🎉" : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
