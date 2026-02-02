import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Campanha, useUpdateCampanha } from "@/hooks/useCampanhas";
import { toast } from "sonner";
import { Target, Calendar, DollarSign, Pencil } from "lucide-react";
import { format } from "date-fns";

interface EditCampanhaModalProps {
  campanha: Campanha | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCampanhaModal({ campanha, open, onOpenChange }: EditCampanhaModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [teamGoal, setTeamGoal] = useState(30);
  const [individualGoal, setIndividualGoal] = useState(10);
  const [bonusValue, setBonusValue] = useState(500);
  const [isActive, setIsActive] = useState(true);

  const updateCampanha = useUpdateCampanha();

  useEffect(() => {
    if (campanha) {
      setName(campanha.name);
      setDescription(campanha.description || "");
      setDeadline(format(new Date(campanha.deadline), "yyyy-MM-dd"));
      setTeamGoal(campanha.team_goal);
      setIndividualGoal(campanha.individual_goal || 10);
      setBonusValue(campanha.bonus_value || 500);
      setIsActive(campanha.is_active);
    }
  }, [campanha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campanha) return;

    if (!name.trim()) {
      toast.error("Nome da campanha é obrigatório");
      return;
    }

    try {
      await updateCampanha.mutateAsync({
        id: campanha.id,
        name,
        description: description || null,
        deadline: new Date(deadline).toISOString(),
        team_goal: teamGoal,
        individual_goal: individualGoal,
        bonus_value: bonusValue,
        is_active: isActive,
      });

      toast.success("Campanha atualizada com sucesso!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao atualizar campanha");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Campanha
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Campanha *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Black Friday 2026"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da campanha..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="isActive">Campanha Ativa</Label>
                <p className="text-xs text-muted-foreground">
                  Desative para encerrar a campanha
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="w-4 h-4" />
              Metas e Bônus
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Prazo Final
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teamGoal">Meta do Time</Label>
                <Input
                  id="teamGoal"
                  type="number"
                  min={1}
                  value={teamGoal}
                  onChange={(e) => setTeamGoal(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="individualGoal">Meta Individual</Label>
                <Input
                  id="individualGoal"
                  type="number"
                  min={1}
                  value={individualGoal}
                  onChange={(e) => setIndividualGoal(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bonusValue" className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Bônus por Meta
                </Label>
                <Input
                  id="bonusValue"
                  type="number"
                  min={0}
                  value={bonusValue}
                  onChange={(e) => setBonusValue(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateCampanha.isPending}>
              {updateCampanha.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
