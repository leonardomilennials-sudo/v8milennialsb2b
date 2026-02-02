import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, User, Package } from "lucide-react";
import { UpsellCampanha, tipoAcaoLabels, canalLabels } from "@/hooks/useUpsell";
import { cn } from "@/lib/utils";

interface UpsellCardProps {
  campanha: UpsellCampanha;
  onClick: () => void;
  isDragging?: boolean;
}

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
  const product = campanha.product;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  // Determine what value to show based on status
  const isPlanned = ["cliente", "planejado", "abordado", "interesse_gerado", "proposta_enviada"].includes(campanha.status);
  const showMrr = campanha.mrr_planejado > 0 || (product?.type === "mrr");
  const showProjeto = campanha.projeto_planejado > 0 || (product?.type !== "mrr" && product?.type);

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
        </div>

        {/* Produto Planejado */}
        {product && (
          <div className="flex items-center gap-1 text-xs">
            <Package className="h-3 w-3 text-primary" />
            <span className="font-medium truncate">{product.name}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] ml-auto",
                product.type === "mrr" ? "border-green-500/50 text-green-500" : "border-blue-500/50 text-blue-500"
              )}
            >
              {product.type === "mrr" ? "MRR" : "Projeto"}
            </Badge>
          </div>
        )}

        {/* Valores Planejados ou Vendidos */}
        {campanha.status === "vendido" && campanha.valor_fechado > 0 ? (
          <div className="text-sm font-bold text-green-500 flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            {formatCurrency(campanha.valor_fechado)}
            <span className="text-xs font-normal text-green-400">vendido</span>
          </div>
        ) : (
          <div className="space-y-1">
            {showMrr && campanha.mrr_planejado > 0 && (
              <div className="text-xs flex items-center gap-1">
                <span className="text-muted-foreground">MRR Plan.:</span>
                <span className="font-semibold text-green-400">{formatCurrency(campanha.mrr_planejado)}</span>
              </div>
            )}
            {showProjeto && campanha.projeto_planejado > 0 && (
              <div className="text-xs flex items-center gap-1">
                <span className="text-muted-foreground">Projeto Plan.:</span>
                <span className="font-semibold text-blue-400">{formatCurrency(campanha.projeto_planejado)}</span>
              </div>
            )}
            {campanha.valor_produto > 0 && !campanha.mrr_planejado && !campanha.projeto_planejado && (
              <div className="text-xs flex items-center gap-1">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-semibold">{formatCurrency(campanha.valor_produto)}</span>
              </div>
            )}
          </div>
        )}

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
