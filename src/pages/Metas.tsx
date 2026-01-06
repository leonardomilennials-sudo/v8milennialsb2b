import { motion } from "framer-motion";
import { Target, Users, TrendingUp, Calendar, Zap, Plus } from "lucide-react";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { useTeamGoals, useIndividualGoals } from "@/hooks/useGoals";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Metas() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const expectedProgress = (dayOfMonth / daysInMonth) * 100;

  const { data: teamGoals, isLoading: goalsLoading } = useTeamGoals(month, year);
  const { data: individualGoals, isLoading: individualLoading } = useIndividualGoals(month, year);
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(month, year);

  const isLoading = goalsLoading || individualLoading || metricsLoading;

  // Find specific goals and their current values
  const faturamentoGoal = teamGoals?.find((g) => g.type === "faturamento");
  const clientesGoal = teamGoals?.find((g) => g.type === "clientes");
  const reunioesGoal = teamGoals?.find((g) => g.type === "reunioes");
  const conversaoGoal = teamGoals?.find((g) => g.type === "conversao");

  // Use real metrics
  const currentFaturamento = metrics?.vendaTotal || 0;
  const currentClientes = metrics?.novosClientes || 0;
  const currentReunioes = metrics?.reunioesComparecidas || 0;
  const currentConversao = metrics?.reunioesMarcadas 
    ? (metrics.reunioesComparecidas / metrics.reunioesMarcadas) * 100 
    : 0;

  // Calculate expected vs actual
  const expectedFaturamento = faturamentoGoal 
    ? (faturamentoGoal.target_value * expectedProgress) / 100 
    : 0;
  const faturamentoDiff = expectedFaturamento > 0 
    ? ((currentFaturamento - expectedFaturamento) / expectedFaturamento) * 100 
    : 0;

  const metasConfig = [
    {
      id: "faturamento",
      title: "Meta de Faturamento Mensal",
      current: currentFaturamento,
      goal: faturamentoGoal?.target_value || 0,
      unit: "R$ ",
      icon: Target,
      description: "Valor total de vendas fechadas no mês",
    },
    {
      id: "clientes",
      title: "Novos Clientes",
      current: currentClientes,
      goal: clientesGoal?.target_value || 0,
      icon: Users,
      description: "Número de novos clientes conquistados",
    },
    {
      id: "reunioes",
      title: "Reuniões Comparecidas",
      current: currentReunioes,
      goal: reunioesGoal?.target_value || 0,
      icon: Calendar,
      description: "Total de reuniões com comparecimento",
    },
    {
      id: "conversao",
      title: "Taxa de Conversão",
      current: Math.round(currentConversao),
      goal: conversaoGoal?.target_value || 0,
      icon: TrendingUp,
      description: "Percentual de reuniões comparecidas",
    },
  ].filter((m) => m.goal > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold flex items-center gap-2"
          >
            <Target className="w-6 h-6 text-primary" />
            Metas
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o progresso das metas do time
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-medium">
            {format(now, "MMMM yyyy", { locale: ptBR })}
          </span>
          <span className="text-muted-foreground">• Dia {dayOfMonth}/{daysInMonth}</span>
        </div>
      </div>

      {/* Progress Indicator */}
      {faturamentoGoal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Onde você deveria estar hoje</h2>
            <span className="text-sm text-muted-foreground">
              {expectedProgress.toFixed(1)}% do mês
            </span>
          </div>
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Faturamento Esperado</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {Math.round(expectedFaturamento).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">Faturamento Atual</p>
                <p className="text-2xl font-bold text-success">
                  R$ {currentFaturamento.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${faturamentoDiff >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                <span className={`text-lg font-bold ${faturamentoDiff >= 0 ? "text-success" : "text-destructive"}`}>
                  {faturamentoDiff >= 0 ? "+" : ""}{faturamentoDiff.toFixed(0)}%
                </span>
                <p className={`text-xs ${faturamentoDiff >= 0 ? "text-success" : "text-destructive"}`}>
                  {faturamentoDiff >= 0 ? "acima" : "abaixo"} do esperado
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Metas Gerais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <h2 className="text-lg font-semibold mb-6">Metas Gerais do Time</h2>
        {isLoading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : metasConfig.length > 0 ? (
          <div className="grid gap-6">
            {metasConfig.map((meta) => (
              <div key={meta.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <meta.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <GoalProgress
                      title={meta.title}
                      current={meta.current}
                      goal={meta.goal}
                      unit={meta.unit}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {meta.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma meta configurada para este mês.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Use o painel de administração para criar metas.
            </p>
          </div>
        )}
      </motion.div>

      {/* Metas por Pessoa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metas por Closer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-6">Metas por Closer</h2>
          {individualLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : individualGoals?.closerGoals && individualGoals.closerGoals.length > 0 ? (
            <div className="space-y-4">
              {individualGoals.closerGoals.map((vendedor) => (
                <div key={vendedor.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-accent-foreground">
                      {vendedor.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{vendedor.name}</span>
                      <span className={`text-sm font-bold ${
                        vendedor.percentage >= 100 ? "text-success" : "text-muted-foreground"
                      }`}>
                        {vendedor.percentage}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(vendedor.percentage, 100)}%` }}
                        transition={{ duration: 0.6 }}
                        className={`progress-fill ${
                          vendedor.percentage >= 100 ? "bg-success" : "gradient-gold"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      R$ {vendedor.current.toLocaleString("pt-BR")} / R$ {vendedor.goal.toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma meta individual para closers.
            </p>
          )}
        </motion.div>

        {/* Metas por SDR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-6">Metas por SDR (Reuniões)</h2>
          {individualLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : individualGoals?.sdrGoals && individualGoals.sdrGoals.length > 0 ? (
            <div className="space-y-4">
              {individualGoals.sdrGoals.map((sdr) => (
                <div key={sdr.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {sdr.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{sdr.name}</span>
                      <span className={`text-sm font-bold ${
                        sdr.percentage >= 100 ? "text-success" : "text-muted-foreground"
                      }`}>
                        {sdr.percentage}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(sdr.percentage, 100)}%` }}
                        transition={{ duration: 0.6 }}
                        className={`progress-fill ${
                          sdr.percentage >= 100 ? "bg-success" : "bg-chart-5"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sdr.current} / {sdr.goal} reuniões comparecidas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma meta individual para SDRs.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
