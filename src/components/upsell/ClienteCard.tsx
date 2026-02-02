import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, TrendingUp, User } from "lucide-react";
import { UpsellClient } from "@/hooks/useUpsell";
import { cn } from "@/lib/utils";

interface ClienteCardProps {
  client: UpsellClient;
  onClick: () => void;
  isDragging?: boolean;
}

const potencialColors: Record<string, string> = {
  baixo: "bg-gray-500/20 text-gray-400",
  medio: "bg-yellow-500/20 text-yellow-400",
  alto: "bg-green-500/20 text-green-400",
};

export function ClienteCard({ client, onClick, isDragging }: ClienteCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: client.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  const potencial = client.potencial_expansao || "medio";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all hover:border-primary/50",
        isDragging && "opacity-50 rotate-2 scale-105 shadow-xl"
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Nome do Cliente */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-sm truncate">
              {client.nome_cliente}
            </h4>
            {client.setor && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {client.setor}
              </p>
            )}
          </div>
          <Badge className={cn("text-[10px] shrink-0", potencialColors[potencial])}>
            {potencial.charAt(0).toUpperCase() + potencial.slice(1)}
          </Badge>
        </div>

        {/* Métricas */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-green-500" />
            MRR: {formatCurrency(client.mrr_atual || 0)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3 text-blue-500" />
          LTV: {formatCurrency(client.ltv_atual || 0)}
        </div>

        {/* Tempo de Contrato */}
        {client.tempo_contrato_meses > 0 && (
          <p className="text-xs text-muted-foreground">
            {client.tempo_contrato_meses} {client.tempo_contrato_meses === 1 ? "mês" : "meses"} de contrato
          </p>
        )}

        {/* Responsável */}
        {client.responsavel && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t border-border/50">
            <User className="h-3 w-3" />
            {client.responsavel.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
