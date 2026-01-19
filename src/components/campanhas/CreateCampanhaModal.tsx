import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateCampanha } from "@/hooks/useCampanhas";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { toast } from "sonner";
import { Plus, X, GripVertical, Target, Users, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface CreateCampanhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StageInput {
  id: string;
  name: string;
  color: string;
  is_reuniao_marcada: boolean;
}

const defaultStages: StageInput[] = [
  { id: "1", name: "Novo", color: "#6B7280", is_reuniao_marcada: false },
  { id: "2", name: "Em Contato", color: "#3B82F6", is_reuniao_marcada: false },
  { id: "3", name: "Qualificado", color: "#8B5CF6", is_reuniao_marcada: false },
  { id: "4", name: "Reunião Marcada", color: "#22C55E", is_reuniao_marcada: true },
  { id: "5", name: "Perdido", color: "#EF4444", is_reuniao_marcada: false },
];

export function CreateCampanhaModal({ open, onOpenChange }: CreateCampanhaModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(format(new Date(), "yyyy-MM-dd"));
  const [teamGoal, setTeamGoal] = useState(30);
  const [individualGoal, setIndividualGoal] = useState(10);
  const [bonusValue, setBonusValue] = useState(500);
  const [stages, setStages] = useState<StageInput[]>(defaultStages);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const createCampanha = useCreateCampanha();
  const { data: teamMembers } = useTeamMembers();

  const handleAddStage = () => {
    const newStage: StageInput = {
      id: Date.now().toString(),
      name: "",
      color: "#3B82F6",
      is_reuniao_marcada: false,
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (id: string) => {
    setStages(stages.filter((s) => s.id !== id));
  };

  const handleStageChange = (id: string, field: keyof StageInput, value: string | boolean) => {
    setStages(stages.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSetReuniaoMarcada = (id: string) => {
    setStages(stages.map((s) => ({
      ...s,
      is_reuniao_marcada: s.id === id,
    })));
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nome da campanha é obrigatório");
      return;
    }

    if (stages.filter((s) => s.name.trim()).length < 2) {
      toast.error("Adicione pelo menos 2 etapas");
      return;
    }

    if (!stages.some((s) => s.is_reuniao_marcada)) {
      toast.error("Selecione uma etapa como 'Reunião Marcada'");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Selecione pelo menos um vendedor");
      return;
    }

    try {
      await createCampanha.mutateAsync({
        name,
        description: description || null,
        deadline: new Date(deadline).toISOString(),
        team_goal: teamGoal,
        individual_goal: individualGoal,
        bonus_value: bonusValue,
        stages: stages
          .filter((s) => s.name.trim())
          .map((s, index) => ({
            name: s.name,
            color: s.color,
            position: index,
            is_reuniao_marcada: s.is_reuniao_marcada,
          })),
        memberIds: selectedMembers,
      });

      toast.success("Campanha criada com sucesso!");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Erro ao criar campanha");
      console.error(error);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDeadline(format(new Date(), "yyyy-MM-dd"));
    setTeamGoal(30);
    setIndividualGoal(10);
    setBonusValue(500);
    setStages(defaultStages);
    setSelectedMembers([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Criar Nova Campanha
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nome da Campanha *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Black Friday 2026"
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição da campanha..."
                  rows={2}
                />
              </div>
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
                <Label htmlFor="teamGoal">Meta do Time (reuniões)</Label>
                <Input
                  id="teamGoal"
                  type="number"
                  min={1}
                  value={teamGoal}
                  onChange={(e) => setTeamGoal(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="individualGoal">Meta Individual (reuniões)</Label>
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

          {/* Stages */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Etapas do Pipe</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddStage}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
            
            <div className="space-y-2">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  
                  <Input
                    value={stage.name}
                    onChange={(e) => handleStageChange(stage.id, "name", e.target.value)}
                    placeholder={`Etapa ${index + 1}`}
                    className="flex-1"
                  />
                  
                  <input
                    type="color"
                    value={stage.color}
                    onChange={(e) => handleStageChange(stage.id, "color", e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  
                  <div className="flex items-center gap-1">
                    <Checkbox
                      id={`reuniao-${stage.id}`}
                      checked={stage.is_reuniao_marcada}
                      onCheckedChange={() => handleSetReuniaoMarcada(stage.id)}
                    />
                    <Label htmlFor={`reuniao-${stage.id}`} className="text-xs whitespace-nowrap cursor-pointer">
                      Reunião Marcada
                    </Label>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStage(stage.id)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              * Marque uma etapa como "Reunião Marcada" para que leads nela sejam contabilizados e enviados para Confirmação.
            </p>
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Vendedores com Acesso
            </h3>
            
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {teamMembers?.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={() => handleMemberToggle(member.id)}
                  />
                  <span className="text-sm">{member.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">({member.role})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCampanha.isPending}>
              {createCampanha.isPending ? "Criando..." : "Criar Campanha"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
