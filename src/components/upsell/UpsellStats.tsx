import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, Repeat, Briefcase } from "lucide-react";
import { UpsellCampanha, UpsellClient } from "@/hooks/useUpsell";

interface UpsellStatsProps {
  campanhas: UpsellCampanha[];
  clients: UpsellClient[];
}

export function UpsellStats({ campanhas, clients }: UpsellStatsProps) {
  // MRR Planejado no mês
  const mrrPlanejado = campanhas.reduce((sum, c) => sum + (c.mrr_planejado || 0), 0);
  
  // Projeto Planejado no mês
  const projetoPlanejado = campanhas.reduce((sum, c) => sum + (c.projeto_planejado || 0), 0);
  
  // MRR Vendido no mês (campanhas com status vendido e produto MRR)
  const mrrVendido = campanhas
    .filter((c) => c.status === "vendido" && (c.product?.type === "mrr" || (c.mrr_planejado || 0) > 0))
    .reduce((sum, c) => sum + (c.valor_fechado || 0), 0);
  
  // Projeto Vendido no mês
  const projetoVendido = campanhas
    .filter((c) => c.status === "vendido" && c.product?.type !== "mrr" && (c.projeto_planejado || 0) > 0)
    .reduce((sum, c) => sum + (c.valor_fechado || 0), 0);

  const stats = [
    {
      label: "MRR Planejado",
      value: `R$ ${mrrPlanejado.toLocaleString("pt-BR")}`,
      icon: Repeat,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "MRR Vendido",
      value: `R$ ${mrrVendido.toLocaleString("pt-BR")}`,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Projeto Planejado",
      value: `R$ ${projetoPlanejado.toLocaleString("pt-BR")}`,
      icon: Briefcase,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Projeto Vendido",
      value: `R$ ${projetoVendido.toLocaleString("pt-BR")}`,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
