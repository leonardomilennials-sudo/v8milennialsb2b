import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, TrendingUp, User } from "lucide-react";
import { UpsellCampanha, tipoAcaoLabels, canalLabels, tipoClienteTempoLabels } from "@/hooks/useUpsell";
import { cn } from "@/lib/utils";

interface UpsellCardProps {
  campanha: UpsellCampanha;
  onClick: () => void;
  isDragging?: boolean;
}

const potencialColors: Record<string, string> = {
  baixo: "bg-gray-500/20 text-gray-400",
  medio: "bg-yellow-500/20 text-yellow-400",
  alto: "bg-green-500/20 text-green-400",
};

const tipoClienteColors: Record<string, string> = {
  onboarding: "bg-blue-500/20 text-blue-400",
  recentes: "bg-cyan-500/20 text-cyan-400",
  iniciantes: "bg-teal-500/20 text-teal-400",
  momento_chave: "bg-orange-500/20 text-orange-400",
  fieis: "bg-purple-500/20 text-purple-400",
  mavericks: "bg-pink-500/20 text-pink-400",
};

export function UpsellCard({ campanha, onClick, isDragging }: UpsellCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: campanha.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const client = campanha.client;
  const potencial = client?.potencial_expansao || "medio";
  const tipoTempo = client?.tipo_cliente_tempo || "onboarding";

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
              {client?.nome_cliente || "Cliente"}
            </h4>
            {client?.setor && (
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

        {/* Tipo de Cliente por Tempo */}
        <Badge variant="outline" className={cn("text-[10px]", tipoClienteColors[tipoTempo])}>
          {tipoClienteTempoLabels[tipoTempo]?.split(" ")[0] || tipoTempo}
        </Badge>

        {/* Métricas */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-green-500" />
            MRR: R$ {(client?.mrr_atual || 0).toLocaleString("pt-BR")}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-blue-500" />
            LTV: R$ {(client?.ltv_atual || 0).toLocaleString("pt-BR")}
          </span>
        </div>

        {/* Tipo de Ação e Canal */}
        <div className="flex flex-wrap gap-1">
          {campanha.tipo_acao && (
            <Badge variant="secondary" className="text-[10px]">
              {tipoAcaoLabels[campanha.tipo_acao] || campanha.tipo_acao}
            </Badge>
          )}
          {campanha.canal && (
            <Badge variant="outline" className="text-[10px]">
              {canalLabels[campanha.canal] || campanha.canal}
            </Badge>
          )}
        </div>

        {/* Valor Fechado (se vendido) */}
        {campanha.status === "vendido" && campanha.valor_fechado > 0 && (
          <div className="text-xs font-semibold text-green-500">
            ✓ R$ {campanha.valor_fechado.toLocaleString("pt-BR")}
          </div>
        )}

        {/* Responsável */}
        {(campanha.responsavel || client?.responsavel) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t border-border/50">
            <User className="h-3 w-3" />
            {campanha.responsavel?.name || client?.responsavel?.name}
          </div>
        )}

        {/* Observações */}
        {campanha.observacoes && (
          <p className="text-xs text-muted-foreground line-clamp-2 italic">
            {campanha.observacoes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
