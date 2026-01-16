import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  RefreshCw, Maximize, Clock, Users, TrendingUp, 
  DollarSign, Calendar, AlertTriangle, Flame, Target,
  Zap, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { useTVDashboardData } from "@/hooks/useTVDashboardData";
import { AICoachSection } from "@/components/tv/AICoachSection";
import { Button } from "@/components/ui/button";
import v8Logo from "@/assets/v8-logo.png";
import logoDark from "@/assets/logo-dark.png";

// Animated counter component
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: { 
  value: number; 
  prefix?: string; 
  suffix?: string;
  decimals?: number;
}) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => {
    if (decimals > 0) return `${prefix}${v.toFixed(decimals)}${suffix}`;
    return `${prefix}${Math.round(v).toLocaleString('pt-BR')}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export default function TVDashboard() {
  const { data, isLoading, refetch } = useTVDashboardData();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const monthName = format(currentTime, "MMMM 'de' yyyy", { locale: ptBR });

  if (isLoading) {
    return (
      <div className="h-screen bg-[hsl(36,20%,8%)] flex items-center justify-center">
        <div className="text-center">
          <img src={v8Logo} alt="V8" className="h-20 mx-auto mb-4 animate-pulse" />
          <p className="text-white/60">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const meta = data?.metaVendasMes || 60000;
  const atual = data?.vendasRealizadas || 0;
  const ondeDeveria = data?.ondeDeveriamEstar || 0;
  const percentage = meta > 0 ? (atual / meta) * 100 : 0;
  const isAhead = atual >= ondeDeveria;
  const quantoFalta = Math.max(0, meta - atual);
  const diferenca = Math.abs(atual - ondeDeveria);
  const closers = data?.individualGoals?.closers || [];
  const sdrs = data?.individualGoals?.sdrs || [];

  return (
    <div className="h-screen bg-[hsl(36,20%,8%)] overflow-hidden flex flex-col">
      {/* Header - Clean & Minimal */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-4">
          <img src={v8Logo} alt="V8" className="h-10" />
          <div className="h-6 w-px bg-white/10" />
          <img src={logoDark} alt="Millennials B2B" className="h-5 opacity-80" />
          <div className="h-6 w-px bg-white/10" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Dashboard Comercial
            </h1>
            <p className="text-xs text-white/40 capitalize">{monthName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-lg font-mono font-semibold text-white">
              {format(currentTime, "HH:mm")}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()} className="text-white/60 hover:text-white hover:bg-white/5">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white/60 hover:text-white hover:bg-white/5">
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Grid - 8pt system */}
      <div className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden">
        
        {/* Left Column - Meta do Mês (Hero) */}
        <div className="col-span-3 flex flex-col gap-4">
          <TVCard className="flex-1">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Meta do Mês</span>
                </div>
                <span className="text-xs text-white/40">Falta R$ {formatCurrency(quantoFalta)}</span>
              </div>

              {/* Main Value */}
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-white mb-1">
                  R$ <AnimatedNumber value={meta} />
                </p>
              </div>

              {/* Thermometer */}
              <div className="flex-1 flex items-center justify-center py-2">
                <div className="relative h-full max-h-[200px] flex items-end">
                  {/* Scale */}
                  <div className="flex flex-col justify-between h-full pr-2 text-[10px] font-mono text-white/30">
                    {[60, 45, 30, 15, 0].map((v) => (
                      <span key={v}>{v}K</span>
                    ))}
                  </div>

                  {/* Tube */}
                  <div className="relative w-12 h-full rounded-t-full bg-white/5 border border-white/10 overflow-hidden">
                    {/* Grid lines */}
                    {[25, 50, 75].map((p) => (
                      <div key={p} className="absolute left-0 right-0 h-px bg-white/5" style={{ bottom: `${p}%` }} />
                    ))}
                    
                    {/* Expected position marker */}
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-white/20"
                      style={{ bottom: `${(ondeDeveria / meta) * 100}%` }}
                    />

                    {/* Fill */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`absolute bottom-0 left-0.5 right-0.5 rounded-t-full ${
                        isAhead 
                          ? "bg-gradient-to-t from-emerald-600 to-emerald-400" 
                          : "bg-gradient-to-t from-amber-600 to-amber-400"
                      }`}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-y-0 left-1 w-1 bg-white/20 rounded-full" />
                    </motion.div>
                  </div>

                  {/* Current value indicator */}
                  <motion.div
                    initial={{ bottom: 0 }}
                    animate={{ bottom: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute right-0 translate-y-1/2"
                    style={{ left: '4.5rem' }}
                  >
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                      isAhead ? "bg-emerald-500 text-white" : "bg-amber-500 text-black"
                    }`}>
                      R$ {formatCurrency(atual)}
                    </div>
                  </motion.div>

                  {/* Bulb */}
                  <motion.div
                    animate={{ 
                      boxShadow: isAhead 
                        ? ["0 0 8px rgba(16,185,129,0.3)", "0 0 16px rgba(16,185,129,0.5)", "0 0 8px rgba(16,185,129,0.3)"]
                        : ["0 0 8px rgba(245,158,11,0.3)", "0 0 16px rgba(245,158,11,0.5)", "0 0 8px rgba(245,158,11,0.3)"]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center ${
                      isAhead ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    <span className="text-sm font-bold text-white">{percentage.toFixed(0)}%</span>
                  </motion.div>
                </div>
              </div>

              {/* Status */}
              <div className={`mt-4 p-2 rounded-lg flex items-center justify-center gap-2 ${
                isAhead ? "bg-emerald-500/10" : "bg-amber-500/10"
              }`}>
                {isAhead ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">+R$ {formatCurrency(diferenca)} à frente</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">-R$ {formatCurrency(diferenca)} atrás</span>
                  </>
                )}
              </div>
            </div>
          </TVCard>
        </div>

        {/* Middle Column - KPIs + Individual Goals */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* KPIs Row - Neutral cards, color only on icon/number/delta */}
          <div className="grid grid-cols-3 gap-3">
            <KPICard 
              icon={Calendar}
              label="Reuniões"
              value={data?.reunioesComparecidas || 0}
              color="blue"
            />
            <KPICard 
              icon={TrendingUp}
              label="Conversão"
              value={(data?.taxaConversaoGeral || 0).toFixed(0)}
              suffix="%"
              color="emerald"
            />
            <KPICard 
              icon={AlertTriangle}
              label="No-Show"
              value={(data?.noShowGeral || 0).toFixed(0)}
              suffix="%"
              color={(data?.noShowGeral || 0) > 30 ? "red" : "amber"}
            />
            <KPICard 
              icon={DollarSign}
              label="Ticket MRR"
              value={formatCurrency(data?.ticketMedioMRR || 0)}
              prefix="R$ "
              color="primary"
            />
            <KPICard 
              icon={DollarSign}
              label="Ticket Proj"
              value={formatCurrency(data?.ticketMedioProjeto || 0)}
              prefix="R$ "
              color="purple"
            />
            <KPICard 
              icon={Users}
              label="Leads"
              value={data?.leadsParaTrabalhar || 0}
              color={(data?.leadsParaTrabalhar || 0) > 15 ? "red" : "emerald"}
            />
          </div>

          {/* Individual Goals */}
          <TVCard className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Metas Individuais</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Closers */}
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Closers</p>
                <div className="space-y-2">
                  {closers.slice(0, 4).map((closer: any, i: number) => (
                    <GoalBar key={closer.id} data={closer} index={i} type="closer" formatCurrency={formatCurrency} />
                  ))}
                  {closers.length === 0 && <p className="text-xs text-white/30">Sem dados</p>}
                </div>
              </div>

              {/* SDRs */}
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">SDRs</p>
                <div className="space-y-2">
                  {sdrs.slice(0, 4).map((sdr: any, i: number) => (
                    <GoalBar key={sdr.id} data={sdr} index={i} type="sdr" formatCurrency={formatCurrency} />
                  ))}
                  {sdrs.length === 0 && <p className="text-xs text-white/30">Sem dados</p>}
                </div>
              </div>
            </div>
          </TVCard>
        </div>

        {/* Right Column - Propostas + Vendas + Coach */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* Hot Proposals */}
          <TVCard>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Propostas Quentes</span>
              </div>
              <span className="text-xs font-semibold text-orange-400">{(data?.propostasQuentes || []).length}</span>
            </div>

            <div className="space-y-2 max-h-[100px] overflow-y-auto">
              {(data?.propostasQuentes || []).slice(0, 4).map((p: any, i: number) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                      {p.calor || 7}
                    </div>
                    <span className="text-sm text-white/80 truncate max-w-[120px]">{p.lead?.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">R$ {formatCurrency(p.sale_value || 0)}</span>
                </motion.div>
              ))}
              {(data?.propostasQuentes || []).length === 0 && (
                <p className="text-xs text-white/30 text-center py-2">Sem propostas quentes</p>
              )}
            </div>
          </TVCard>

          {/* Monthly Sales */}
          <TVCard>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Vendas do Mês</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400">{(data?.vendasDoMes || []).length}</span>
            </div>

            {/* Summary Pills */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 text-center py-1.5 px-2 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-white/40">MRR</p>
                <p className="text-sm font-semibold text-primary">R$ {formatCurrency(data?.vendasMRR || 0)}</p>
              </div>
              <div className="flex-1 text-center py-1.5 px-2 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-white/40">Projeto</p>
                <p className="text-sm font-semibold text-purple-400">R$ {formatCurrency(data?.vendasProjeto || 0)}</p>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[70px] overflow-y-auto">
              {(data?.vendasDoMes || []).slice(0, 3).map((sale: any, i: number) => (
                <motion.div 
                  key={sale.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-1 px-2 rounded bg-emerald-500/5"
                >
                  <span className="text-xs text-white/70 truncate max-w-[140px]">{sale.leadName}</span>
                  <span className="text-xs font-semibold text-emerald-400">R$ {formatCurrency(sale.value)}</span>
                </motion.div>
              ))}
            </div>
          </TVCard>

          {/* AI Coach */}
          <TVCard className="flex-1" accent="purple">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Coach IA</span>
            </div>
            <div className="h-[calc(100%-2rem)] overflow-y-auto">
              <AICoachSection />
            </div>
          </TVCard>
        </div>
      </div>
    </div>
  );
}

// Unified TV Card Component
function TVCard({ 
  children, 
  className = "",
  accent
}: { 
  children: React.ReactNode; 
  className?: string;
  accent?: "purple" | "orange" | "emerald";
}) {
  const accentClasses = {
    purple: "border-purple-500/20 bg-purple-500/[0.02]",
    orange: "border-orange-500/20 bg-orange-500/[0.02]",
    emerald: "border-emerald-500/20 bg-emerald-500/[0.02]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`
        p-4 rounded-xl
        bg-white/[0.03] border border-white/5
        backdrop-blur-sm
        ${accent ? accentClasses[accent] : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

// KPI Card - Neutral background, color only on icon/number
function KPICard({ 
  icon: Icon, 
  label, 
  value, 
  prefix = "",
  suffix = "",
  color,
  delta
}: { 
  icon: React.ElementType;
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  color: string;
  delta?: { value: number; positive: boolean };
}) {
  const colorMap: Record<string, { icon: string; text: string }> = {
    blue: { icon: "text-blue-400", text: "text-blue-400" },
    emerald: { icon: "text-emerald-400", text: "text-emerald-400" },
    amber: { icon: "text-amber-400", text: "text-amber-400" },
    red: { icon: "text-red-400", text: "text-red-400" },
    purple: { icon: "text-purple-400", text: "text-purple-400" },
    primary: { icon: "text-primary", text: "text-primary" },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.04)" }}
      className="p-3 rounded-xl bg-white/[0.03] border border-white/5 transition-all cursor-default"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${colors.icon}`} />
        <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl font-bold ${colors.text}`}>
        {prefix}{value}{suffix}
      </p>
      {delta && (
        <div className={`flex items-center gap-0.5 text-[10px] mt-0.5 ${delta.positive ? "text-emerald-400" : "text-red-400"}`}>
          {delta.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{delta.value}%</span>
        </div>
      )}
    </motion.div>
  );
}

// Individual Goal Bar
function GoalBar({ 
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
      className="group"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            isCompleted 
              ? "bg-emerald-500 text-white" 
              : "bg-white/10 text-white/60"
          }`}>
            {data.name?.charAt(0)}
          </div>
          <span className="text-xs text-white/70 group-hover:text-white/90 transition-colors">{data.name}</span>
        </div>
        <span className={`text-xs font-semibold ${isCompleted ? "text-emerald-400" : "text-white/80"}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
          className={`h-full rounded-full ${
            isCompleted 
              ? "bg-emerald-500" 
              : percentage >= 75 
                ? "bg-primary" 
                : percentage >= 50 
                  ? "bg-amber-500" 
                  : "bg-white/30"
          }`}
        />
      </div>
    </motion.div>
  );
}
