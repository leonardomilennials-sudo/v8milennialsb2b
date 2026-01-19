import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CampanhaStage, CampanhaLead, useUpdateCampanhaLead } from "@/hooks/useCampanhas";
import { Phone, Mail, Building2, GripVertical, User } from "lucide-react";
import { toast } from "sonner";
import { openWhatsApp } from "@/lib/whatsapp";

interface CampanhaKanbanProps {
  campanhaId: string;
  stages: CampanhaStage[];
  leads: CampanhaLead[];
  onMoveToConfirmacao: (lead: CampanhaLead) => void;
}

interface KanbanCardProps {
  lead: CampanhaLead;
  isReuniao: boolean;
  onMoveToConfirmacao: (lead: CampanhaLead) => void;
}

function KanbanCardItem({ lead, isReuniao, onMoveToConfirmacao }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-card hover:border-primary/30 transition-colors">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{lead.lead?.name}</h4>
              {lead.lead?.company && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{lead.lead.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex items-center gap-2 text-xs">
            {lead.lead?.phone && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => openWhatsApp(lead.lead!.phone!)}
              >
                <Phone className="w-3 h-3" />
              </Button>
            )}
            {lead.lead?.email && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => window.open(`mailto:${lead.lead!.email}`)}
              >
                <Mail className="w-3 h-3" />
              </Button>
            )}
            {lead.sdr && (
              <div className="flex items-center gap-1 ml-auto text-muted-foreground">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{lead.sdr.name}</span>
              </div>
            )}
          </div>

          {/* Move to Confirmação button for "Reunião Marcada" stage */}
          {isReuniao && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs h-7"
              onClick={() => onMoveToConfirmacao(lead)}
            >
              Enviar para Confirmação
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KanbanColumn({
  stage,
  leads,
  isReuniao,
  onMoveToConfirmacao,
}: {
  stage: CampanhaStage;
  leads: CampanhaLead[];
  isReuniao: boolean;
  onMoveToConfirmacao: (lead: CampanhaLead) => void;
}) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px] bg-muted/30 rounded-lg">
      <div
        className="p-3 border-b flex items-center justify-between"
        style={{ borderBottomColor: stage.color || "#3B82F6" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color || "#3B82F6" }}
          />
          <h3 className="font-semibold text-sm">{stage.name}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {leads.length}
        </Badge>
      </div>

      <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-350px)]">
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <KanbanCardItem
              key={lead.id}
              lead={lead}
              isReuniao={isReuniao}
              onMoveToConfirmacao={onMoveToConfirmacao}
            />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum lead
          </div>
        )}
      </div>
    </div>
  );
}

export function CampanhaKanban({
  campanhaId,
  stages,
  leads,
  onMoveToConfirmacao,
}: CampanhaKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateLead = useUpdateCampanhaLead();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Find the target stage
    const targetStage = stages.find((s) => s.id === overId);
    if (!targetStage) {
      // Check if dropped over another lead - get its stage
      const targetLead = leads.find((l) => l.id === overId);
      if (!targetLead) return;

      const lead = leads.find((l) => l.id === leadId);
      if (!lead || lead.stage_id === targetLead.stage_id) return;

      try {
        await updateLead.mutateAsync({
          id: leadId,
          campanha_id: campanhaId,
          stage_id: targetLead.stage_id,
        });
        toast.success("Lead movido com sucesso");
      } catch (error) {
        toast.error("Erro ao mover lead");
      }
      return;
    }

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage_id === targetStage.id) return;

    try {
      await updateLead.mutateAsync({
        id: leadId,
        campanha_id: campanhaId,
        stage_id: targetStage.id,
      });
      toast.success("Lead movido com sucesso");
    } catch (error) {
      toast.error("Erro ao mover lead");
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Can be used for visual feedback
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;
  const reuniaoStage = stages.find((s) => s.is_reuniao_marcada);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={leads.filter((l) => l.stage_id === stage.id)}
            isReuniao={stage.id === reuniaoStage?.id}
            onMoveToConfirmacao={onMoveToConfirmacao}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead && (
          <Card className="bg-card shadow-lg">
            <CardContent className="p-3">
              <h4 className="font-medium text-sm">{activeLead.lead?.name}</h4>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
