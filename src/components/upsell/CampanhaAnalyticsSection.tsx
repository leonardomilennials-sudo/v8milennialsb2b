import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UpsellCampanha, upsellStatusColumns, tipoAcaoLabels, canalLabels } from "@/hooks/useUpsell";
import { useGoals } from "@/hooks/useGoals";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, DollarSign, Target, Percent, Package } from "lucide-react";

interface CampanhaAnalyticsSectionProps {
  campanhas: UpsellCampanha[];
  selectedMonth?: number;
  selectedYear?: number;
}

export function CampanhaAnalyticsSection({ campanhas, selectedMonth, selectedYear }: CampanhaAnalyticsSectionProps) {
  const now = new Date();
  const month = selectedMonth ?? now.getMonth() + 1;
  const year = selectedYear ?? now.getFullYear();

  const { data: goals = [] } = useGoals(month, year);

  // Calculate metrics - Planned vs Sold
  const totalCampanhas = campanhas.length;
  const campanhasVendidas = campanhas.filter((c) => c.status === "vendido");

  // MRR Metrics
  const mrrPlanejado = campanhas.reduce((acc, c) => acc + (c.mrr_planejado || 0), 0);
  const mrrVendido = campanhasVendidas
    .filter((c) => c.product?.type === "mrr" || c.mrr_planejado > 0)
    .reduce((acc, c) => acc + (c.valor_fechado || 0), 0);

  // Projeto Metrics
  const projetoPlanejado = campanhas.reduce((acc, c) => acc + (c.projeto_planejado || 0), 0);
  const projetoVendido = campanhasVendidas
    .filter((c) => c.product?.type !== "mrr" && !c.mrr_planejado)
    .reduce((acc, c) => acc + (c.valor_fechado || 0), 0);

  // Total values
  const totalPlanejado = mrrPlanejado + projetoPlanejado;
  const totalVendido = campanhasVendidas.reduce((acc, c) => acc + (c.valor_fechado || 0), 0);
  const taxaConversao = totalCampanhas > 0 ? (campanhasVendidas.length / totalCampanhas) * 100 : 0;

  // Goals
  const metaMrrUpsell = goals.find((g) => g.type === "upsell_mrr");
  const metaProjetoUpsell = goals.find((g) => g.type === "upsell_projeto");

  // Status distribution data
  const statusData = upsellStatusColumns.map((status) => ({
    name: status.title,
    value: campanhas.filter((c) => c.status === status.id).length,
    color: status.color,
  })).filter((s) => s.value > 0);

  // Planned vs Sold comparison data
  const comparisonData = [
    {
      name: "MRR",
      planejado: mrrPlanejado,
      vendido: mrrVendido,
    },
    {
      name: "Projeto",
      planejado: projetoPlanejado,
      vendido: projetoVendido,
    },
  ].filter((d) => d.planejado > 0 || d.vendido > 0);

  // Canal distribution
  const canalData = Object.entries(canalLabels).map(([key, label]) => ({
    name: label,
    total: campanhas.filter((c) => c.canal === key).length,
    valor: campanhas.filter((c) => c.canal === key && c.status === "vendido").reduce((acc, c) => acc + (c.valor_fechado || 0), 0),
  })).filter((c) => c.total > 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  const COLORS = ["#22C55E", "#3B82F6", "#F97316", "#8B5CF6", "#EF4444", "#F5C518", "#64748B", "#6B7280"];

  return (
    <div className="space-y-6">
      {/* KPI Cards - Planejado vs Vendido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MRR Planejado</p>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(mrrPlanejado)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-600/10">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MRR Vendido</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(mrrVendido)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-500/10">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Projeto Planejado</p>
              <p className="text-2xl font-bold text-blue-500">{formatCurrency(projetoPlanejado)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-600/10">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Projeto Vendido</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(projetoVendido)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Progress Cards */}
      {(metaMrrUpsell || metaProjetoUpsell) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metaMrrUpsell && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Meta MRR Upsell
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{formatCurrency(mrrVendido)}</span>
                    <span className="text-muted-foreground">{formatCurrency(metaMrrUpsell.target_value)}</span>
                  </div>
                  <Progress 
                    value={Math.min((mrrVendido / metaMrrUpsell.target_value) * 100, 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {((mrrVendido / metaMrrUpsell.target_value) * 100).toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {metaProjetoUpsell && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Meta Projeto Upsell
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{formatCurrency(projetoVendido)}</span>
                    <span className="text-muted-foreground">{formatCurrency(metaProjetoUpsell.target_value)}</span>
                  </div>
                  <Progress 
                    value={Math.min((projetoVendido / metaProjetoUpsell.target_value) * 100, 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {((projetoVendido / metaProjetoUpsell.target_value) * 100).toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Campanhas</p>
              <p className="text-2xl font-bold">{totalCampanhas}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Vendido</p>
              <p className="text-2xl font-bold">{formatCurrency(totalVendido)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-purple-500/10">
              <Percent className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">{taxaConversao.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planejado vs Vendido */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Planejado vs Vendido</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhuma campanha com valores planejados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="planejado" name="Planejado" fill="#64748B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="vendido" name="Vendido" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhuma campanha neste período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Canal Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Performance por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {canalData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhuma campanha neste período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={canalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis yAxisId="left" stroke="#888" />
                  <YAxis yAxisId="right" orientation="right" stroke="#888" tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value: number, name: string) =>
                      name === "valor" ? formatCurrency(value) : value
                    }
                  />
                  <Bar yAxisId="left" dataKey="total" name="Campanhas" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="valor" name="Valor Vendido" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
