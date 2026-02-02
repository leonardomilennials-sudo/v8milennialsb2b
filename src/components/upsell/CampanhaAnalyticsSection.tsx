import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpsellCampanha, upsellStatusColumns, tipoAcaoLabels, canalLabels } from "@/hooks/useUpsell";
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
import { TrendingUp, DollarSign, Target, Users } from "lucide-react";

interface CampanhaAnalyticsSectionProps {
  campanhas: UpsellCampanha[];
}

export function CampanhaAnalyticsSection({ campanhas }: CampanhaAnalyticsSectionProps) {
  // Calculate metrics
  const totalCampanhas = campanhas.length;
  const campanhasVendidas = campanhas.filter((c) => c.status === "vendido");
  const totalVendido = campanhasVendidas.reduce((acc, c) => acc + (c.valor_fechado || 0), 0);
  const taxaConversao = totalCampanhas > 0 ? (campanhasVendidas.length / totalCampanhas) * 100 : 0;
  const receitaIncremental = campanhas.reduce((acc, c) => acc + (c.receita_incremental || 0), 0);

  // Status distribution data
  const statusData = upsellStatusColumns.map((status) => ({
    name: status.title,
    value: campanhas.filter((c) => c.status === status.id).length,
    color: status.color,
  })).filter((s) => s.value > 0);

  // Tipo de ação distribution
  const tipoAcaoData = Object.entries(tipoAcaoLabels).map(([key, label]) => ({
    name: label,
    campanhas: campanhas.filter((c) => c.tipo_acao === key).length,
    vendidos: campanhas.filter((c) => c.tipo_acao === key && c.status === "vendido").length,
  })).filter((t) => t.campanhas > 0);

  // Canal distribution
  const canalData = Object.entries(canalLabels).map(([key, label]) => ({
    name: label,
    total: campanhas.filter((c) => c.canal === key).length,
    valor: campanhas.filter((c) => c.canal === key && c.status === "vendido").reduce((acc, c) => acc + (c.valor_fechado || 0), 0),
  })).filter((c) => c.total > 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  const COLORS = ["#22C55E", "#3B82F6", "#F97316", "#8B5CF6", "#EF4444", "#F5C518", "#64748B"];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-sm text-muted-foreground">Valor Vendido</p>
              <p className="text-2xl font-bold">{formatCurrency(totalVendido)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">{taxaConversao.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-purple-500/10">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Incremental</p>
              <p className="text-2xl font-bold">{formatCurrency(receitaIncremental)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Tipo de Ação Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campanhas por Tipo de Ação</CardTitle>
          </CardHeader>
          <CardContent>
            {tipoAcaoData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhuma campanha neste período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tipoAcaoData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#888" />
                  <YAxis dataKey="name" type="category" stroke="#888" width={100} fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="campanhas" name="Total" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="vendidos" name="Vendidos" fill="#22C55E" radius={[0, 4, 4, 0]} />
                  <Legend />
                </BarChart>
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
