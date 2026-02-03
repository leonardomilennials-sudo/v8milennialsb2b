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
  Legend
} from "recharts";
import { Card } from "@/components/ui/card";
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Target,
  CalendarCheck,
  CalendarX
} from "lucide-react";
import { isToday, isYesterday, isThisMonth, isThisWeek, format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConfirmacaoAnalyticsProps {
  data: any[];
}

const ORIGIN_LABELS: Record<string, string> = {
  calendly: "Calendly",
  whatsapp: "WhatsApp",
  meta_ads: "Meta Ads",
  outro: "Outro",
  remarketing: "Remarketing",
  base_clientes: "Base Clientes",
  parceiro: "Parceiro",
  indicacao: "Indicação",
  quiz: "Quiz",
  site: "Site",
  organico: "Orgânico",
  cal: "Cal.com",
  ambos: "Ambos",
  zydon: "Zydon",
};

const FATURAMENTO_ORDER = [
  "Até R$ 50mil",
  "R$ 50mil - R$ 100mil",
  "R$ 100mil - R$ 250mil",
  "R$ 250mil - R$ 500mil",
  "R$ 500mil - R$ 1M",
  "R$ 1M - R$ 5M",
  "Acima de R$ 5M",
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#ec4899",
];

export function ConfirmacaoAnalytics({ data }: ConfirmacaoAnalyticsProps) {
  const analytics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        thisMonth: 0,
        byOrigin: [],
        byFaturamento: [],
        byCloser: [],
        closerShowRate: [],
      };
    }

    // Reuniões por período
    const today = data.filter(item => item.meeting_date && isToday(new Date(item.meeting_date))).length;
    const yesterday = data.filter(item => item.meeting_date && isYesterday(new Date(item.meeting_date))).length;
    const thisWeek = data.filter(item => item.meeting_date && isThisWeek(new Date(item.meeting_date), { locale: ptBR })).length;
    const thisMonth = data.filter(item => item.meeting_date && isThisMonth(new Date(item.meeting_date))).length;

    // Por Origem (apenas do mês atual)
    const monthlyData = data.filter(item => item.meeting_date && isThisMonth(new Date(item.meeting_date)));
    const originCounts: Record<string, number> = {};
    monthlyData.forEach(item => {
      const origin = item.lead?.origin || "outro";
      originCounts[origin] = (originCounts[origin] || 0) + 1;
    });
    const byOrigin = Object.entries(originCounts)
      .map(([origin, count]) => ({
        name: ORIGIN_LABELS[origin] || origin,
        value: count,
        origin,
      }))
      .sort((a, b) => b.value - a.value);

    // Por Faturamento
    const faturamentoCounts: Record<string, number> = {};
    data.forEach(item => {
      const faturamento = item.lead?.faturamento || "Não informado";
      faturamentoCounts[faturamento] = (faturamentoCounts[faturamento] || 0) + 1;
    });
    const byFaturamento = Object.entries(faturamentoCounts)
      .map(([faturamento, count]) => ({
        name: faturamento,
        reunioes: count,
      }))
      .sort((a, b) => {
        const indexA = FATURAMENTO_ORDER.indexOf(a.name);
        const indexB = FATURAMENTO_ORDER.indexOf(b.name);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

    // Por Closer
    const closerCounts: Record<string, { name: string; total: number; compareceu: number; perdido: number }> = {};
    data.forEach(item => {
      const closerName = item.closer?.name || item.lead?.closer?.name || "Sem Closer";
      const closerId = item.closer_id || item.lead?.closer_id || "none";
      
      if (!closerCounts[closerId]) {
        closerCounts[closerId] = { name: closerName, total: 0, compareceu: 0, perdido: 0 };
      }
      closerCounts[closerId].total += 1;
      
      if (item.status === "compareceu") {
        closerCounts[closerId].compareceu += 1;
      } else if (item.status === "perdido" || item.status === "remarcar") {
        closerCounts[closerId].perdido += 1;
      }
    });

    const byCloser = Object.values(closerCounts)
      .map(c => ({
        name: c.name,
        reunioes: c.total,
      }))
      .sort((a, b) => b.reunioes - a.reunioes);

    // Taxa de Comparecimento por Closer
    const closerShowRate = Object.values(closerCounts)
      .filter(c => c.compareceu + c.perdido > 0) // Apenas closers com resultados finais
      .map(c => {
        const finalizados = c.compareceu + c.perdido;
        const taxaComparecimento = finalizados > 0 ? Math.round((c.compareceu / finalizados) * 100) : 0;
        return {
          name: c.name,
          compareceu: c.compareceu,
          noShow: c.perdido,
          taxa: taxaComparecimento,
          total: finalizados,
        };
      })
      .sort((a, b) => b.taxa - a.taxa);

    return {
      today,
      yesterday,
      thisWeek,
      thisMonth,
      byOrigin,
      byFaturamento,
      byCloser,
      closerShowRate,
    };
  }, [data]);

  const currentMonth = format(new Date(), "MMMM yyyy", { locale: ptBR });

  const summaryCards = [
    { title: "Reuniões Hoje", value: analytics.today, icon: Calendar, color: "text-primary" },
    { title: "Ontem", value: analytics.yesterday, icon: CalendarCheck, color: "text-chart-2" },
    { title: "Esta Semana", value: analytics.thisWeek, icon: TrendingUp, color: "text-chart-3" },
    { title: "Este Mês", value: analytics.thisMonth, icon: Target, color: "text-chart-4" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reuniões por Origem */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Reuniões por Origem - {currentMonth}
            </h3>
            {analytics.byOrigin.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.byOrigin}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.byOrigin.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados para este mês
              </div>
            )}
          </Card>
        </motion.div>

        {/* Reuniões por Faturamento */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-chart-2" />
              Reuniões por Faturamento
            </h3>
            {analytics.byFaturamento.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byFaturamento} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Bar 
                      dataKey="reunioes" 
                      fill="hsl(var(--chart-2))" 
                      radius={[0, 4, 4, 0]}
                      name="Reuniões"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reuniões por Closer */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-chart-3" />
              Reuniões por Closer
            </h3>
            {analytics.byCloser.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byCloser}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Bar 
                      dataKey="reunioes" 
                      fill="hsl(var(--chart-3))" 
                      radius={[4, 4, 0, 0]}
                      name="Reuniões"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </Card>
        </motion.div>

        {/* Taxa de Comparecimento por Closer */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-success" />
              Taxa de Comparecimento por Closer
            </h3>
            {analytics.closerShowRate.length > 0 ? (
              <div className="space-y-4">
                {analytics.closerShowRate.map((closer, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{closer.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-success">{closer.compareceu} ✓</span>
                        <span className="text-destructive">{closer.noShow} ✗</span>
                        <span className={`font-bold ${
                          closer.taxa >= 70 ? 'text-success' : 
                          closer.taxa >= 50 ? 'text-warning' : 'text-destructive'
                        }`}>
                          {closer.taxa}%
                        </span>
                      </div>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                      <div 
                        className="bg-success transition-all" 
                        style={{ width: `${closer.taxa}%` }} 
                      />
                      <div 
                        className="bg-destructive transition-all" 
                        style={{ width: `${100 - closer.taxa}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <CalendarX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Sem dados de comparecimento finalizados</p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Detailed Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Detalhamento por Origem (Mês Atual)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Origem</th>
                  <th className="text-center py-3 px-4">Reuniões Marcadas</th>
                  <th className="text-center py-3 px-4">% do Total</th>
                </tr>
              </thead>
              <tbody>
                {analytics.byOrigin.map((origin, idx) => {
                  const percentage = analytics.thisMonth > 0 
                    ? ((origin.value / analytics.thisMonth) * 100).toFixed(1) 
                    : "0";
                  return (
                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{origin.name}</td>
                      <td className="py-3 px-4 text-center">{origin.value}</td>
                      <td className="py-3 px-4 text-center">{percentage}%</td>
                    </tr>
                  );
                })}
                {analytics.byOrigin.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      Nenhuma reunião marcada neste mês
                    </td>
                  </tr>
                )}
              </tbody>
              {analytics.byOrigin.length > 0 && (
                <tfoot>
                  <tr className="bg-muted/30 font-semibold">
                    <td className="py-3 px-4">Total</td>
                    <td className="py-3 px-4 text-center">{analytics.thisMonth}</td>
                    <td className="py-3 px-4 text-center">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
