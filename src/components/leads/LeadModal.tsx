import { useState } from "react";
import { Star, Building, Phone, Mail, User, Tag } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useCreateLead, useUpdateLead } from "@/hooks/useLeads";
import { toast } from "sonner";

const originLabels: Record<string, string> = {
  site: "Site",
  indicacao: "Indicação",
  outbound: "Outbound",
  evento: "Evento",
  redes_sociais: "Redes Sociais",
  outro: "Outro",
};

interface LeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: any;
  onSuccess?: () => void;
  defaultSdrId?: string;
  defaultCloserId?: string;
}

interface FormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  origin: string;
  rating: number;
  segment: string;
  faturamento: number | null;
  urgency: string;
  notes: string;
  sdr_id: string | null;
  closer_id: string | null;
}

function StarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          className="cursor-pointer hover:scale-110 transition-transform"
        >
          <Star
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-chart-5 text-chart-5"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function LeadModal({ 
  open, 
  onOpenChange, 
  lead, 
  onSuccess,
  defaultSdrId,
  defaultCloserId
}: LeadModalProps) {
  const isEditing = !!lead;
  
  const [formData, setFormData] = useState<FormData>(() => ({
    name: lead?.name || "",
    company: lead?.company || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    origin: lead?.origin || "outro",
    rating: lead?.rating || 5,
    segment: lead?.segment || "",
    faturamento: lead?.faturamento || null,
    urgency: lead?.urgency || "",
    notes: lead?.notes || "",
    sdr_id: lead?.sdr_id || defaultSdrId || null,
    closer_id: lead?.closer_id || defaultCloserId || null,
  }));

  const { data: teamMembers = [] } = useTeamMembers();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const sdrs = teamMembers.filter(m => m.role === "sdr" && m.is_active);
  const closers = teamMembers.filter(m => m.role === "closer" && m.is_active);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      const payload = {
        ...formData,
        origin: formData.origin as any,
        faturamento: formData.faturamento || null,
        sdr_id: formData.sdr_id || null,
        closer_id: formData.closer_id || null,
      };

      if (isEditing) {
        await updateLead.mutateAsync({ id: lead.id, ...payload });
        toast.success("Lead atualizado!");
      } else {
        await createLead.mutateAsync(payload);
        toast.success("Lead criado!");
      }
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao salvar lead");
      console.error(error);
    }
  };

  // Reset form when lead changes
  useState(() => {
    if (open) {
      setFormData({
        name: lead?.name || "",
        company: lead?.company || "",
        email: lead?.email || "",
        phone: lead?.phone || "",
        origin: lead?.origin || "outro",
        rating: lead?.rating || 5,
        segment: lead?.segment || "",
        faturamento: lead?.faturamento || null,
        urgency: lead?.urgency || "",
        notes: lead?.notes || "",
        sdr_id: lead?.sdr_id || defaultSdrId || null,
        closer_id: lead?.closer_id || defaultCloserId || null,
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {isEditing ? "Editar Lead" : "Novo Lead"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do lead"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Empresa</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Nome da empresa"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@empresa.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="origin">Origem</Label>
                <Select
                  value={formData.origin}
                  onValueChange={(v) => setFormData({ ...formData, origin: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(originLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Rating do SDR (1-10)</Label>
                <div className="py-2">
                  <StarRating
                    rating={formData.rating}
                    onRate={(r) => setFormData({ ...formData, rating: r })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sdr">SDR Responsável</Label>
                <Select
                  value={formData.sdr_id || "none"}
                  onValueChange={(v) => setFormData({ ...formData, sdr_id: v === "none" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar SDR" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {sdrs.map(sdr => (
                      <SelectItem key={sdr.id} value={sdr.id}>{sdr.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="closer">Closer Responsável</Label>
                <Select
                  value={formData.closer_id || "none"}
                  onValueChange={(v) => setFormData({ ...formData, closer_id: v === "none" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar Closer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {closers.map(closer => (
                      <SelectItem key={closer.id} value={closer.id}>{closer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="segment">Segmento</Label>
                <Input
                  id="segment"
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                  placeholder="Ex: Tecnologia, Varejo..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="faturamento">Faturamento (R$)</Label>
                <Input
                  id="faturamento"
                  type="number"
                  value={formData.faturamento || ""}
                  onChange={(e) => setFormData({ ...formData, faturamento: e.target.value ? Number(e.target.value) : null })}
                  placeholder="100000"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="urgency">Urgência</Label>
              <Input
                id="urgency"
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                placeholder="Ex: Alta, Média, Baixa..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações sobre o lead..."
                rows={4}
              />
            </div>

            {lead?.lead_tags?.length > 0 && (
              <div className="grid gap-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {lead.lead_tags.map((lt: any) => (
                    <Badge
                      key={lt.tag.id}
                      variant="outline"
                      style={{ 
                        backgroundColor: `${lt.tag.color}20`,
                        borderColor: `${lt.tag.color}40`,
                        color: lt.tag.color
                      }}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {lt.tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createLead.isPending || updateLead.isPending}
          >
            {isEditing ? "Salvar Alterações" : "Criar Lead"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
