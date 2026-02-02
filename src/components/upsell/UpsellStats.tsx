import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Target, UserCheck, UserX } from "lucide-react";
import { UpsellCampanha, UpsellClient } from "@/hooks/useUpsell";

interface UpsellStatsProps {
  campanhas: UpsellCampanha[];
  clients: UpsellClient[];
}

export function UpsellStats({ campanhas, clients }: UpsellStatsProps) {
  // Total MRR atual de todos os clientes
  const totalMrr = clients.reduce((sum, c) => sum + (c.mrr_atual || 0), 0);
  
  // Total LTV atual
  const totalLtv = clients.reduce((sum, c) => sum + (c.ltv_atual || 0), 0);
  
  // Valor fechado no mês (campanhas com status vendido)
  const valorFechadoMes = campanhas
    .filter((c) => c.status === "vendido")
    .reduce((sum, c) => sum + (c.valor_fechado || 0), 0);
  
  // Clientes ativos (MRR > 0)
  const clientesAtivos = clients.filter((c) => (c.mrr_atual || 0) > 0).length;
  
  // Clientes inativos (MRR = 0)
  const clientesInativos = clients.filter((c) => (c.mrr_atual || 0) === 0).length;

  const stats = [
    {
      label: "MRR Total da Base",
      value: `R$ ${totalMrr.toLocaleString("pt-BR")}`,
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Upsell Fechado no Mês",
      value: `R$ ${valorFechadoMes.toLocaleString("pt-BR")}`,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Clientes Ativos",
      value: clientesAtivos.toString(),
      icon: UserCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Clientes Inativos",
      value: clientesInativos.toString(),
      icon: UserX,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
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
