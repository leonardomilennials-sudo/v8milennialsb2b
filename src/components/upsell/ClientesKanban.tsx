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
import { UpsellClient, tipoClienteTempoLabels, useUpdateUpsellClient } from "@/hooks/useUpsell";
import { ClienteCard } from "./ClienteCard";
import { toast } from "sonner";

interface ClientesKanbanProps {
  clients: UpsellClient[];
  onCardClick: (client: UpsellClient) => void;
}

type TipoClienteTempo = "onboarding" | "recentes" | "iniciantes" | "momento_chave" | "fieis" | "mavericks";

const clienteTempoColumns: { id: TipoClienteTempo; title: string; color: string }[] = [
  { id: "onboarding", title: "Onboarding", color: "#3B82F6" },
  { id: "recentes", title: "Recentes", color: "#06B6D4" },
  { id: "iniciantes", title: "Iniciantes", color: "#14B8A6" },
  { id: "momento_chave", title: "Momento-chave", color: "#F97316" },
  { id: "fieis", title: "Fiéis", color: "#22C55E" },
  { id: "mavericks", title: "Mavericks", color: "#8B5CF6" },
];

function DroppableColumn({
  id,
  title,
  color,
  children,
  count,
  mrr,
}: {
  id: string;
  title: string;
  color: string;
  children: React.ReactNode;
  count: number;
  mrr: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] max-w-[280px] bg-muted/30 rounded-xl border transition-all ${
        isOver ? "border-primary bg-primary/5" : "border-border/50"
      }`}
    >
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          MRR: {formatCurrency(mrr)}
        </p>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2 min-h-[200px]">{children}</div>
      </ScrollArea>
    </div>
  );
}

export function ClientesKanban({ clients, onCardClick }: ClientesKanbanProps) {
  const updateClient = useUpdateUpsellClient();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getClientsByTipo = (tipo: TipoClienteTempo) => {
    return clients.filter((c) => c.tipo_cliente_tempo === tipo);
  };

  const getMrrByTipo = (tipo: TipoClienteTempo) => {
    return clients
      .filter((c) => c.tipo_cliente_tempo === tipo)
      .reduce((acc, c) => acc + (c.mrr_atual || 0), 0);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);

    if (!over) return;

    const clientId = active.id as string;
    const newTipo = over.id as TipoClienteTempo;

    const client = clients.find((c) => c.id === clientId);
    if (!client || client.tipo_cliente_tempo === newTipo) return;

    try {
      await updateClient.mutateAsync({
        id: clientId,
        tipo_cliente_tempo: newTipo,
      });
      toast.success(`Cliente movido para ${tipoClienteTempoLabels[newTipo]?.split(" ")[0]}`);
    } catch (error) {
      toast.error("Erro ao atualizar cliente");
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
        {clienteTempoColumns.map((column) => {
          const cards = getClientsByTipo(column.id);
          const mrr = getMrrByTipo(column.id);
          return (
            <DroppableColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              count={cards.length}
              mrr={mrr}
            >
              <SortableContext
                items={cards.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {cards.map((client) => (
                  <ClienteCard
                    key={client.id}
                    client={client}
                    onClick={() => onCardClick(client)}
                    isDragging={draggingId === client.id}
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
