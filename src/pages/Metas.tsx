import { motion } from "framer-motion";
import { Target, Users, TrendingUp, Calendar, Zap } from "lucide-react";
import { GoalProgress } from "@/components/dashboard/GoalProgress";

interface MetaConfig {
  id: string;
  title: string;
  current: number;
  goal: number;
  unit?: string;
  icon: React.ElementType;
  description: string;
}

const metasGerais: MetaConfig[] = [
  {
    id: "faturamento",
    title: "Meta de Faturamento Mensal",
    current: 285000,
    goal: 400000,
    unit: "R$ ",
    icon: Target,
    description: "Valor total de vendas fechadas no mês",
  },
  {
    id: "clientes",
    title: "Novos Clientes",
    current: 34,
    goal: 50,
    icon: Users,
    description: "Número de novos clientes conquistados",
  },
  {
    id: "reunioes",
    title: "Reuniões Comparecidas",
    current: 126,
    goal: 200,
    icon: Calendar,
    description: "Total de reuniões com comparecimento",
  },
  {
    id: "conversao",
    title: "Taxa de Conversão",
    current: 38,
    goal: 40,
    icon: TrendingUp,
    description: "Percentual de propostas convertidas em vendas",
  },
];

const metasPorVendedor = [
  { name: "Maria Santos", current: 85000, goal: 80000, percentage: 106 },
  { name: "João Silva", current: 72000, goal: 80000, percentage: 90 },
  { name: "Ana Costa", current: 68000, goal: 80000, percentage: 85 },
  { name: "Pedro Lima", current: 45000, goal: 80000, percentage: 56 },
  { name: "Carla Souza", current: 38000, goal: 80000, percentage: 48 },
];

const metasPorSDR = [
  { name: "Lucas Mendes", current: 45, goal: 40, percentage: 112 },
  { name: "Julia Ferreira", current: 41, goal: 40, percentage: 102 },
  { name: "Rafael Costa", current: 38, goal: 40, percentage: 95 },
];

export default function Metas() {
  // Calculate expected progress for the day
  const dayOfMonth = 6;
  const daysInMonth = 31;
  const expectedProgress = (dayOfMonth / daysInMonth) * 100;

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
          <span className="font-medium">Janeiro 2026</span>
          <span className="text-muted-foreground">• Dia {dayOfMonth}/31</span>
        </div>
      </div>

      {/* Progress Indicator */}
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
                R$ {Math.round(400000 * expectedProgress / 100).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">Faturamento Atual</p>
              <p className="text-2xl font-bold text-success">R$ 285.000</p>
            </div>
            <div className="px-4 py-2 bg-success/10 rounded-lg">
              <span className="text-lg font-bold text-success">+368%</span>
              <p className="text-xs text-success">acima do esperado</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metas Gerais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <h2 className="text-lg font-semibold mb-6">Metas Gerais do Time</h2>
        <div className="grid gap-6">
          {metasGerais.map((meta) => (
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
      </motion.div>

      {/* Metas por Pessoa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metas por Vendedor/Closer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-6">Metas por Closer</h2>
          <div className="space-y-4">
            {metasPorVendedor.map((vendedor) => (
              <div key={vendedor.name} className="flex items-center gap-4">
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
        </motion.div>

        {/* Metas por SDR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-6">Metas por SDR (Reuniões)</h2>
          <div className="space-y-4">
            {metasPorSDR.map((sdr) => (
              <div key={sdr.name} className="flex items-center gap-4">
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
        </motion.div>
      </div>
    </div>
  );
}
