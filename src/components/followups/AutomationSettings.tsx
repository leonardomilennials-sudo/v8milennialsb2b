import { useState } from "react";
import { motion } from "framer-motion";
import { Settings2, MessageSquare, Calendar, Kanban, Zap, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useFollowUpAutomations, useUpdateFollowUpAutomation, type FollowUpAutomation } from "@/hooks/useFollowUps";

const pipeConfig = {
  whatsapp: {
    label: "WhatsApp SDR",
    icon: MessageSquare,
    color: "text-success",
    stages: [
      { value: "novo", label: "Novo" },
      { value: "em_contato", label: "Em Contato" },
      { value: "agendado", label: "Agendado" },
      { value: "compareceu", label: "Compareceu" },
    ],
  },
  confirmacao: {
    label: "Confirmação",
    icon: Calendar,
    color: "text-chart-4",
    stages: [
      { value: "reuniao_marcada", label: "Reunião Marcada" },
      { value: "confirmado", label: "Confirmado" },
      { value: "remarcado", label: "Remarcado" },
      { value: "compareceu", label: "Compareceu" },
    ],
  },
  propostas: {
    label: "Propostas",
    icon: Kanban,
    color: "text-primary",
    stages: [
      { value: "marcar_compromisso", label: "Marcar Compromisso" },
      { value: "proposta_enviada", label: "Proposta Enviada" },
      { value: "negociacao", label: "Negociação" },
    ],
  },
};

const priorityLabels = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

interface AutomationItemProps {
  automation: FollowUpAutomation;
  onUpdate: (id: string, updates: Partial<FollowUpAutomation>) => void;
}

function AutomationItem({ automation, onUpdate }: AutomationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAutomation, setEditedAutomation] = useState(automation);

  const handleSave = () => {
    onUpdate(automation.id, {
      title_template: editedAutomation.title_template,
      description_template: editedAutomation.description_template,
      days_offset: editedAutomation.days_offset,
      priority: editedAutomation.priority,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedAutomation(automation);
    setIsEditing(false);
  };

  const stageLabel = pipeConfig[automation.pipe_type].stages.find(
    (s) => s.value === automation.stage
  )?.label || automation.stage;

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {stageLabel}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              +{automation.days_offset} dias
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                automation.priority === "urgent" ? "text-destructive border-destructive/30" :
                automation.priority === "high" ? "text-chart-5 border-chart-5/30" :
                "text-muted-foreground"
              }`}
            >
              {priorityLabels[automation.priority]}
            </Badge>
          </div>

          {isEditing ? (
            <div className="space-y-3 mt-3">
              <div>
                <Label className="text-xs">Título</Label>
                <Input
                  value={editedAutomation.title_template}
                  onChange={(e) => setEditedAutomation({
                    ...editedAutomation,
                    title_template: e.target.value,
                  })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={editedAutomation.description_template || ""}
                  onChange={(e) => setEditedAutomation({
                    ...editedAutomation,
                    description_template: e.target.value,
                  })}
                  className="h-8 text-sm"
                  placeholder="Descrição opcional"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Dias após</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editedAutomation.days_offset}
                    onChange={(e) => setEditedAutomation({
                      ...editedAutomation,
                      days_offset: parseInt(e.target.value) || 0,
                    })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Prioridade</Label>
                  <Select
                    value={editedAutomation.priority}
                    onValueChange={(v: FollowUpAutomation["priority"]) => 
                      setEditedAutomation({ ...editedAutomation, priority: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Check className="w-4 h-4 mr-1" />
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="font-medium text-sm">{automation.title_template}</p>
              {automation.description_template && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {automation.description_template}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-7 px-2"
            >
              Editar
            </Button>
          )}
          <Switch
            checked={automation.is_active}
            onCheckedChange={(checked) => onUpdate(automation.id, { is_active: checked })}
          />
        </div>
      </div>
    </div>
  );
}

export function AutomationSettings() {
  const { data: automations, isLoading } = useFollowUpAutomations();
  const updateAutomation = useUpdateFollowUpAutomation();

  const handleUpdate = (id: string, updates: Partial<FollowUpAutomation>) => {
    updateAutomation.mutate({ id, ...updates });
  };

  const groupedAutomations = automations?.reduce((acc, automation) => {
    if (!acc[automation.pipe_type]) {
      acc[automation.pipe_type] = [];
    }
    acc[automation.pipe_type].push(automation);
    return acc;
  }, {} as Record<string, FollowUpAutomation[]>);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Zap className="w-4 h-4" />
          Automações
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Configurar Automações de Follow Up
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Configure tarefas automáticas que serão criadas quando leads entrarem em cada etapa dos pipes.
          </p>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {Object.entries(pipeConfig).map(([pipeType, config]) => {
                const PipeIcon = config.icon;
                const pipeAutomations = groupedAutomations?.[pipeType] || [];

                return (
                  <AccordionItem
                    key={pipeType}
                    value={pipeType}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <PipeIcon className={`w-4 h-4 ${config.color}`} />
                        <span className="font-medium">{config.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {pipeAutomations.filter((a) => a.is_active).length} ativas
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-3">
                      {pipeAutomations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma automação configurada
                        </p>
                      ) : (
                        pipeAutomations.map((automation) => (
                          <AutomationItem
                            key={automation.id}
                            automation={automation}
                            onUpdate={handleUpdate}
                          />
                        ))
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
