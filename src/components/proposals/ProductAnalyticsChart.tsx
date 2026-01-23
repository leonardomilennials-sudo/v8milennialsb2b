import { useMemo } from "react";
import { motion } from "framer-motion";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, DollarSign, FileText, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductData {
  productId: string;
  productName: string;
  productType: "mrr" | "projeto" | "unitario";
  proposalCount: number;
  proposalValue: number;
  soldCount: number;
  soldValue: number;
}

interface ProductAnalyticsChartProps {
  data: ProductData[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
];

export function ProductAnalyticsChart({ data }: ProductAnalyticsChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value.toLocaleString("pt-BR")}`;
  };

  const totals = useMemo(() => {
    return data.reduce(
      (acc, item) => ({
        proposals: acc.proposals + item.proposalCount,
        proposalValue: acc.proposalValue + item.proposalValue,
        sold: acc.sold + item.soldCount,
        soldValue: acc.soldValue + item.soldValue,
      }),
      { proposals: 0, proposalValue: 0, sold: 0, soldValue: 0 }
    );
  }, [data]);

  const pieDataProposals = useMemo(() => {
    return data.map((item, index) => ({
      name: item.productName,
      value: item.proposalCount,
      color: COLORS[index % COLORS.length],
    }));
  }, [data]);

  const pieDataSold = useMemo(() => {
    return data.map((item, index) => ({
      name: item.productName,
      value: item.soldValue,
      color: COLORS[index % COLORS.length],
    }));
  }, [data]);

  const barData = useMemo(() => {
    return data.map((item) => ({
      name: item.productName.length > 12 
        ? item.productName.slice(0, 12) + "..." 
        : item.productName,
      fullName: item.productName,
      proposals: item.proposalValue,
      vendido: item.soldValue,
      type: item.productType,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Nenhum produto encontrado nas propostas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Total Produtos</p>
            <Package className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">{data.length}</p>
          <p className="text-xs text-muted-foreground">em negociação</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Propostas</p>
            <FileText className="w-4 h-4 text-chart-5" />
          </div>
          <p className="text-2xl font-bold">{totals.proposals}</p>
          <p className="text-xs text-muted-foreground">{formatCurrency(totals.proposalValue)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Vendas</p>
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-success">{totals.sold}</p>
          <p className="text-xs text-muted-foreground">{formatCurrency(totals.soldValue)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">
            {formatCurrency(totals.sold > 0 ? totals.soldValue / totals.sold : 0)}
          </p>
          <p className="text-xs text-muted-foreground">por venda</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart - Value Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Valor por Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => formatCurrency(v)}
                    className="text-xs"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "proposals" ? "Em proposta" : "Vendido",
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullName || label;
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="proposals" fill="hsl(var(--chart-5))" name="Em proposta" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="vendido" fill="hsl(var(--success))" name="Vendido" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Proposals Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-chart-5" />
              Distribuição de Propostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieDataProposals}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieDataProposals.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} propostas`, ""]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Product Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Detalhamento por Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Produto</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Propostas</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor em Proposta</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Vendas</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor Vendido</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Conversão</th>
                </tr>
              </thead>
              <tbody>
                {data
                  .sort((a, b) => b.soldValue - a.soldValue)
                  .map((product, index) => {
                    const conversionRate = product.proposalCount > 0 
                      ? Math.round((product.soldCount / product.proposalCount) * 100)
                      : 0;
                    return (
                      <motion.tr
                        key={product.productId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{product.productName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-4",
                              product.productType === "mrr"
                                ? "bg-chart-5/10 text-chart-5 border-chart-5/20"
                                : product.productType === "unitario"
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-primary/10 text-primary border-primary/20"
                            )}
                          >
                            {product.productType === "mrr"
                              ? "MRR"
                              : product.productType === "unitario"
                              ? "Unitário"
                              : "Projeto"}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="font-medium">{product.proposalCount}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-chart-5 font-medium">
                            {formatCurrency(product.proposalValue)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="font-medium text-success">{product.soldCount}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-success font-semibold">
                            {formatCurrency(product.soldValue)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              conversionRate >= 50 
                                ? "bg-success/10 text-success border-success/20"
                                : conversionRate >= 25
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {conversionRate}%
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-medium">
                  <td className="py-3 px-2">Total</td>
                  <td className="py-3 px-2 text-center">{data.length} produtos</td>
                  <td className="py-3 px-2 text-center">{totals.proposals}</td>
                  <td className="py-3 px-2 text-right text-chart-5">{formatCurrency(totals.proposalValue)}</td>
                  <td className="py-3 px-2 text-center text-success">{totals.sold}</td>
                  <td className="py-3 px-2 text-right text-success font-bold">{formatCurrency(totals.soldValue)}</td>
                  <td className="py-3 px-2 text-center">
                    <Badge variant="outline" className="text-xs">
                      {totals.proposals > 0 ? Math.round((totals.sold / totals.proposals) * 100) : 0}%
                    </Badge>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
