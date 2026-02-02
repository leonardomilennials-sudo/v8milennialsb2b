import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  rectIntersection,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UpsellCampanha, upsellStatusColumns, useUpdateUpsellCampanha, UpsellStatus } from "@/hooks/useUpsell";
import { UpsellCard } from "./UpsellCard";
import { toast } from "sonner";

interface UpsellKanbanProps {
  campanhas: UpsellCampanha[];
  onCardClick: (campanha: UpsellCampanha) => void;
}

function DroppableColumn({
  id,
  title,
  color,
  children,
  count,
}: {
  id: string;
  title: string;
  color: string;
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[300px] max-w-[300px] bg-muted/30 rounded-xl border transition-all ${
        isOver ? "border-primary bg-primary/5" : "border-border/50"
      }`}
    >
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2 min-h-[200px]">{children}</div>
      </ScrollArea>
    </div>
  );
}

export function UpsellKanban({ campanhas, onCardClick }: UpsellKanbanProps) {
  const updateCampanha = useUpdateUpsellCampanha();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getCardsByStatus = (status: UpsellStatus) => {
    return campanhas.filter((c) => c.status === status);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);

    if (!over) return;

    const campanhaId = active.id as string;
    const newStatus = over.id as UpsellStatus;

    const campanha = campanhas.find((c) => c.id === campanhaId);
    if (!campanha || campanha.status === newStatus) return;

    try {
      await updateCampanha.mutateAsync({
        id: campanhaId,
        status: newStatus,
        data_abordagem: newStatus !== "planejado" && !campanha.data_abordagem 
          ? new Date().toISOString() 
          : campanha.data_abordagem,
      });
      toast.success(`Status atualizado para ${upsellStatusColumns.find(s => s.id === newStatus)?.title}`);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={(event) => setDraggingId(event.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {upsellStatusColumns.map((column) => {
          const cards = getCardsByStatus(column.id);
          return (
            <DroppableColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              count={cards.length}
            >
              <SortableContext
                items={cards.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {cards.map((campanha) => (
                  <UpsellCard
                    key={campanha.id}
                    campanha={campanha}
                    onClick={() => onCardClick(campanha)}
                    isDragging={draggingId === campanha.id}
                  />
                ))}
              </SortableContext>
            </DroppableColumn>
          );
        })}
      </div>
    </DndContext>
  );
}
