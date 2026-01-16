import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RefreshCw, Maximize, Clock, Users, TrendingUp, DollarSign, Calendar, AlertTriangle, Flame } from "lucide-react";
import { useTVDashboardData } from "@/hooks/useTVDashboardData";
import { SalesThermometer } from "@/components/tv/SalesThermometer";
import { AICoachSection } from "@/components/tv/AICoachSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import v8Logo from "@/assets/v8-logo.png";
import logoDark from "@/assets/logo-dark.png";

export default function TVDashboard() {
  const { data, isLoading, refetch } = useTVDashboardData();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => refetch(), 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  const monthName = format(currentTime, "MMMM 'de' yyyy", { locale: ptBR });

  if (isLoading) {
    return (
      <div className="h-screen bg-sidebar p-4 flex items-center justify-center">
        <div className="text-center">
          <img src={v8Logo} alt="V8" className="h-20 mx-auto mb-4 animate-pulse" />
          <p className="text-sidebar-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const closers = data?.individualGoals.closers || [];
  const sdrs = data?.individualGoals.sdrs || [];

  return (
    <div className="h-screen bg-sidebar overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-sidebar-border bg-sidebar-accent/30">
        <div className="flex items-center gap-4">
          <img src={v8Logo} alt="V8" className="h-12" />
          <div className="h-8 w-px bg-sidebar-border" />
          <img src={logoDark} alt="Millennials B2B" className="h-6" />
          <div className="h-8 w-px bg-sidebar-border" />
          <div>
            <h1 className="text-xl font-black text-sidebar-foreground font-racing tracking-wide">
              DASHBOARD COMERCIAL
            </h1>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{monthName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sidebar-accent border border-sidebar-border">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xl font-mono font-bold text-sidebar-foreground">
              {format(currentTime, "HH:mm")}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()} className="text-sidebar-foreground hover:bg-sidebar-accent">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-sidebar-foreground hover:bg-sidebar-accent">
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content - Single Screen */}
      <div className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Left Column: Thermometer */}
        <div className="col-span-3 bg-card rounded-xl p-4 border border-border relative">
          <SalesThermometer
            meta={data?.metaVendasMes || 60000}
            atual={data?.vendasRealizadas || 0}
            ondeDeveria={data?.ondeDeveriamEstar || 0}
          />
        </div>

        {/* Middle Column: Goals + Metrics */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Individual Goals */}
          <div className="bg-card rounded-xl p-4 border border-border flex-1">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              METAS INDIVIDUAIS
            </h3>
            
            <div className="grid grid-cols-2 gap-4 h-[calc(100%-2rem)]">
              {/* Closers */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">CLOSERS (Faturamento)</p>
                <div className="space-y-2">
                  {closers.slice(0, 4).map((closer, i) => (
                    <GoalMiniBar key={closer.id} data={closer} index={i} type="closer" formatCurrency={formatCurrency} />
                  ))}
                  {closers.length === 0 && <p className="text-xs text-muted-foreground">Sem metas</p>}
                </div>
              </div>
              
              {/* SDRs */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">SDRs (Reuniões)</p>
                <div className="space-y-2">
                  {sdrs.slice(0, 4).map((sdr, i) => (
                    <GoalMiniBar key={sdr.id} data={sdr} index={i} type="sdr" formatCurrency={formatCurrency} />
                  ))}
                  {sdrs.length === 0 && <p className="text-xs text-muted-foreground">Sem metas</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <MetricMini 
              icon={Calendar} 
              label="Reuniões" 
              value={data?.reunioesComparecidas || 0}
              color="blue"
            />
            <MetricMini 
              icon={TrendingUp} 
              label="Conversão" 
              value={`${(data?.taxaConversaoGeral || 0).toFixed(0)}%`}
              color="green"
            />
            <MetricMini 
              icon={AlertTriangle} 
              label="No-Show" 
              value={`${(data?.noShowGeral || 0).toFixed(0)}%`}
              color={(data?.noShowGeral || 0) > 30 ? "red" : "amber"}
            />
            <MetricMini 
              icon={DollarSign} 
              label="Ticket MRR" 
              value={formatCurrency(data?.ticketMedioMRR || 0)}
              color="primary"
            />
            <MetricMini 
              icon={DollarSign} 
              label="Ticket Projeto" 
              value={formatCurrency(data?.ticketMedioProjeto || 0)}
              color="purple"
            />
            <MetricMini 
              icon={Users} 
              label="Leads Trabalhar" 
              value={data?.leadsParaTrabalhar || 0}
              color={(data?.leadsParaTrabalhar || 0) > 15 ? "red" : "green"}
            />
          </div>
        </div>

        {/* Right Column: Hot Proposals + Sales + AI */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* Hot Proposals */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              PROPOSTAS QUENTES
            </h3>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
              {(data?.propostasQuentes || []).slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                      {p.calor || 7}
                    </div>
                    <span className="text-foreground font-medium truncate max-w-[120px]">{p.lead?.name}</span>
                  </div>
                  <span className="text-primary font-bold">{formatCurrency(p.sale_value || 0)}</span>
                </div>
              ))}
              {(data?.propostasQuentes || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Sem propostas quentes</p>
              )}
            </div>
          </div>

          {/* Monthly Sales */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-success" />
                VENDAS DO MÊS
              </span>
              <span className="text-success">{(data?.vendasDoMes || []).length} vendas</span>
            </h3>
            <div className="flex gap-4 mb-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">MRR</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(data?.vendasMRR || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Projeto</p>
                <p className="text-sm font-bold text-purple-400">{formatCurrency(data?.vendasProjeto || 0)}</p>
              </div>
            </div>
            <div className="space-y-1 max-h-[80px] overflow-y-auto">
              {(data?.vendasDoMes || []).slice(0, 4).map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between p-1.5 rounded bg-success/10 text-xs">
                  <span className="text-foreground truncate max-w-[150px]">{sale.leadName}</span>
                  <span className="text-success font-bold">{formatCurrency(sale.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Coach - Compact */}
          <div className="bg-gradient-to-br from-purple-500/20 to-indigo-600/10 rounded-xl p-3 border border-purple-500/30 flex-1 overflow-hidden">
            <AICoachCompact />
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini Goal Bar Component
function GoalMiniBar({ 
  data, 
  index, 
  type, 
  formatCurrency 
}: { 
  data: any; 
  index: number; 
  type: "closer" | "sdr";
  formatCurrency: (v: number) => string;
}) {
  const percentage = Math.min(data.percentage || 0, 100);
  const isCompleted = percentage >= 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-2"
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        isCompleted ? "bg-success text-white" : "bg-primary/20 text-primary"
      }`}>
        {data.name?.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground font-medium truncate">{data.name}</span>
          <span className={`font-bold ${isCompleted ? "text-success" : "text-foreground"}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, delay: index * 0.05 }}
            className={`h-full rounded-full ${
              isCompleted ? "bg-success" : "bg-primary"
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Mini Metric Component
function MetricMini({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    green: "bg-success/20 text-success border-success/30",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    red: "bg-destructive/20 text-destructive border-destructive/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    primary: "bg-primary/20 text-primary border-primary/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-3 rounded-lg border ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </motion.div>
  );
}

// Compact AI Coach
function AICoachCompact() {
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
        <span className="text-purple-400">✨</span>
        COACH IA
      </h3>
      <div className="flex-1 overflow-y-auto">
        <AICoachSection />
      </div>
    </div>
  );
}
