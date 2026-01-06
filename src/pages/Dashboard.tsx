import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Target,
  Zap,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { RankingPreview } from "@/components/dashboard/RankingPreview";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import boltIcon from "@/assets/bolt-icon.png";

// Mock data
const mockRankingData = [
  { id: "1", name: "Maria Santos", value: 85000, position: 1 },
  { id: "2", name: "João Silva", value: 72000, position: 2 },
  { id: "3", name: "Ana Costa", value: 68000, position: 3 },
  { id: "4", name: "Pedro Lima", value: 45000, position: 4 },
  { id: "5", name: "Carla Souza", value: 38000, position: 5 },
];

const funnelSteps = [
  { label: "Leads", value: 450, color: "bg-chart-3" },
  { label: "Reuniões Marcadas", value: 180, color: "bg-primary" },
  { label: "Compareceram", value: 126, color: "bg-chart-5" },
  { label: "Propostas", value: 89, color: "bg-warning" },
  { label: "Vendas", value: 34, color: "bg-success" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold"
          >
            Bom dia, João! ⚡
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo do seu time comercial
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Janeiro 2026</span>
          <img src={boltIcon} alt="" className="w-8 h-8 opacity-80" />
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Leads"
          value="450"
          subtitle="Este mês"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Reuniões Marcadas"
          value="180"
          subtitle="70% confirmadas"
          icon={Calendar}
          trend={{ value: 8, isPositive: true }}
          variant="primary"
        />
        <MetricCard
          title="Taxa de Comparecimento"
          value="70%"
          subtitle="126 de 180"
          icon={CheckCircle2}
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard
          title="Taxa de No-Show"
          value="30%"
          subtitle="54 não compareceram"
          icon={XCircle}
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Valor Total Vendido"
          value="R$ 285.000"
          subtitle="34 vendas fechadas"
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
          variant="success"
        />
        <MetricCard
          title="Ticket Médio MRR"
          value="R$ 4.500"
          subtitle="22 contratos MRR"
          icon={TrendingUp}
        />
        <MetricCard
          title="Ticket Médio Projeto"
          value="R$ 12.800"
          subtitle="12 projetos"
          icon={Target}
        />
      </div>

      {/* Goal Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Progresso da Meta Mensal</h2>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Dia 6 de 31</span>
          </div>
        </div>

        <div className="grid gap-6">
          <GoalProgress
            title="Meta de Faturamento"
            current={285000}
            goal={400000}
            unit="R$ "
          />
          <GoalProgress
            title="Meta de Novos Clientes"
            current={34}
            goal={50}
          />
          <GoalProgress
            title="Meta de Reuniões Comparecidas"
            current={126}
            goal={200}
          />
          <GoalProgress
            title="Onde deveria estar hoje"
            current={285000}
            goal={77419}
            unit="R$ "
          />
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart title="Funil de Vendas" steps={funnelSteps} />
        <RankingPreview title="Top Vendedores" users={mockRankingData} />
      </div>

      {/* Conversion by SDR/Closer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-5"
        >
          <h3 className="font-semibold mb-4">Conversão por SDR</h3>
          <div className="space-y-4">
            {[
              { name: "Lucas Mendes", meetings: 45, attended: 38, rate: 84 },
              { name: "Julia Ferreira", meetings: 52, attended: 41, rate: 79 },
              { name: "Rafael Costa", meetings: 38, attended: 28, rate: 74 },
            ].map((sdr) => (
              <div key={sdr.name} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {sdr.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{sdr.name}</span>
                    <span className="text-sm font-bold text-success">
                      {sdr.rate}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill bg-success"
                      style={{ width: `${sdr.rate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sdr.attended} de {sdr.meetings} reuniões
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-card rounded-xl border border-border p-5"
        >
          <h3 className="font-semibold mb-4">Conversão por Closer</h3>
          <div className="space-y-4">
            {[
              { name: "Maria Santos", proposals: 32, closed: 14, rate: 44 },
              { name: "João Silva", proposals: 28, closed: 11, rate: 39 },
              { name: "Ana Costa", proposals: 29, closed: 9, rate: 31 },
            ].map((closer) => (
              <div key={closer.name} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-xs font-semibold text-accent-foreground">
                    {closer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{closer.name}</span>
                    <span className="text-sm font-bold text-primary">
                      {closer.rate}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill gradient-gold"
                      style={{ width: `${closer.rate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {closer.closed} de {closer.proposals} propostas
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
