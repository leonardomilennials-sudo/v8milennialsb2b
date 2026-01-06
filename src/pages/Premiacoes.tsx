import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Trophy, Star, Plus, Trash2, Edit2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAwards, useCreateAward, useUpdateAward, useDeleteAward, Award } from "@/hooks/useAwards";
import { useUserRole } from "@/hooks/useUserRole";

const awardTypeLabels: Record<string, { label: string; icon: typeof Trophy }> = {
  meta_mensal: { label: "Meta Mensal", icon: Target },
  campeonato: { label: "Campeonato", icon: Trophy },
  bonus: { label: "Bônus", icon: Star },
  especial: { label: "Especial", icon: Gift },
};

function AwardCard({ award, isAdmin, onEdit, onDelete }: { 
  award: Award; 
  isAdmin: boolean;
  onEdit: (award: Award) => void;
  onDelete: (id: string) => void;
}) {
  const typeConfig = awardTypeLabels[award.type] || awardTypeLabels.especial;
  const Icon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6 relative group"
    >
      {isAdmin && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(award)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(award.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{award.name}</h3>
            <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
              {typeConfig.label}
            </span>
          </div>
          {award.description && (
            <p className="text-sm text-muted-foreground mb-3">{award.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Meta: </span>
              <span className="font-medium">
                {award.type === "meta_mensal" 
                  ? `R$ ${award.threshold.toLocaleString("pt-BR")}`
                  : award.threshold
                }
              </span>
            </div>
            {award.prize_value && (
              <div>
                <span className="text-muted-foreground">Prêmio: </span>
                <span className="font-medium text-success">
                  R$ {award.prize_value.toLocaleString("pt-BR")}
                </span>
              </div>
            )}
          </div>
          {award.prize_description && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{award.prize_description}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AwardFormDialog({ 
  open, 
  onOpenChange, 
  award,
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  award?: Award | null;
  onSave: (data: Omit<Award, "id" | "created_at">) => void;
}) {
  const [formData, setFormData] = useState({
    name: award?.name || "",
    type: award?.type || "meta_mensal",
    description: award?.description || "",
    threshold: award?.threshold || 0,
    prize_description: award?.prize_description || "",
    prize_value: award?.prize_value || 0,
    is_active: award?.is_active ?? true,
    month: award?.month || null,
    year: award?.year || null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      threshold: Number(formData.threshold),
      prize_value: Number(formData.prize_value) || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{award ? "Editar Premiação" : "Nova Premiação"}</DialogTitle>
          <DialogDescription>
            Configure os detalhes da premiação para o time.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Premiação</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Closer do Mês"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta_mensal">Meta Mensal</SelectItem>
                  <SelectItem value="campeonato">Campeonato</SelectItem>
                  <SelectItem value="bonus">Bônus</SelectItem>
                  <SelectItem value="especial">Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a premiação..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="threshold">Meta/Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prize_value">Valor do Prêmio (R$)</Label>
                <Input
                  id="prize_value"
                  type="number"
                  value={formData.prize_value}
                  onChange={(e) => setFormData({ ...formData, prize_value: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prize_description">Descrição do Prêmio</Label>
              <Textarea
                id="prize_description"
                value={formData.prize_description}
                onChange={(e) => setFormData({ ...formData, prize_description: e.target.value })}
                placeholder="Ex: Viagem para Fernando de Noronha..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Premiacoes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<Award | null>(null);

  const { data: awards, isLoading } = useAwards();
  const { data: userRole } = useUserRole();
  const createAward = useCreateAward();
  const updateAward = useUpdateAward();
  const deleteAward = useDeleteAward();

  const isAdmin = userRole?.role === "admin";

  const handleSave = (data: Omit<Award, "id" | "created_at">) => {
    if (editingAward) {
      updateAward.mutate({ id: editingAward.id, ...data });
    } else {
      createAward.mutate(data);
    }
    setEditingAward(null);
  };

  const handleEdit = (award: Award) => {
    setEditingAward(award);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta premiação?")) {
      deleteAward.mutate(id);
    }
  };

  const handleNewAward = () => {
    setEditingAward(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold flex items-center gap-2"
          >
            <Gift className="w-6 h-6 text-primary" />
            Premiações
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as premiações e incentivos do time
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleNewAward} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Premiação
          </Button>
        )}
      </div>

      {/* Awards Grid */}
      {isLoading ? (
        <div className="grid gap-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[150px] rounded-xl" />
          ))}
        </div>
      ) : awards && awards.length > 0 ? (
        <div className="grid gap-4">
          {awards.map((award) => (
            <AwardCard
              key={award.id}
              award={award}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded-xl p-12 text-center"
        >
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma premiação configurada</h3>
          <p className="text-muted-foreground mb-4">
            Crie premiações para motivar e engajar o time.
          </p>
          {isAdmin && (
            <Button onClick={handleNewAward}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Premiação
            </Button>
          )}
        </motion.div>
      )}

      {/* Form Dialog */}
      <AwardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        award={editingAward}
        onSave={handleSave}
      />
    </div>
  );
}
