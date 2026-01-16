import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tv, RefreshCw, Maximize, Clock } from "lucide-react";
import { useTVDashboardData } from "@/hooks/useTVDashboardData";
import { SalesThermometer } from "@/components/tv/SalesThermometer";
import { IndividualGoals } from "@/components/tv/IndividualGoals";
import { TVMetricsGrid } from "@/components/tv/TVMetricsGrid";
import { ConversionByCloser } from "@/components/tv/ConversionByCloser";
import { NoShowByCloser } from "@/components/tv/NoShowByCloser";
import { HotProposals } from "@/components/tv/HotProposals";
import { MonthlySales } from "@/components/tv/MonthlySales";
import { AICoachSection } from "@/components/tv/AICoachSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const monthName = format(currentTime, "MMMM yyyy", { locale: ptBR });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-[500px] col-span-1" />
          <Skeleton className="h-[500px] col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 lg:p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-4">
          <img src={logoDark} alt="Logo" className="h-10 dark:block hidden" />
          <img src={logoDark} alt="Logo" className="h-10 dark:hidden invert" />
          <div className="h-8 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Tv className="w-6 h-6 text-primary" />
              Dashboard Comercial
            </h1>
            <p className="text-sm text-muted-foreground capitalize">{monthName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Clock */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-2xl font-mono font-bold text-foreground">
              {format(currentTime, "HH:mm:ss")}
            </span>
          </div>

          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </motion.header>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="leads">Leads para Trabalhar</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top Row: Thermometer + Individual Goals */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Thermometer */}
            <div className="xl:col-span-1">
              <SalesThermometer
                meta={data?.metaVendasMes || 0}
                atual={data?.vendasRealizadas || 0}
                ondeDeveria={data?.ondeDeveriamEstar || 0}
                quantoFalta={data?.quantoFalta || 0}
              />
            </div>

            {/* Individual Goals + AI Coach */}
            <div className="xl:col-span-2 space-y-6">
              <IndividualGoals
                closers={data?.individualGoals.closers || []}
                sdrs={data?.individualGoals.sdrs || []}
              />
              <AICoachSection />
            </div>
          </div>

          {/* Metrics Grid */}
          <TVMetricsGrid
            reunioesComparecidas={data?.reunioesComparecidas || 0}
            taxaConversaoGeral={data?.taxaConversaoGeral || 0}
            ticketMedioMRR={data?.ticketMedioMRR || 0}
            ticketMedioProjeto={data?.ticketMedioProjeto || 0}
            noShowGeral={data?.noShowGeral || 0}
            leadsParaTrabalhar={data?.leadsParaTrabalhar || 0}
            leadsRemarcar={data?.leadsRemarcar || 0}
            leadsNovo={data?.leadsNovo || 0}
            leadsEmContato={data?.leadsEmContato || 0}
          />

          {/* Bottom Row: Conversions, No-Show, Hot Proposals, Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            <ConversionByCloser data={data?.conversaoPorCloser || []} />
            <NoShowByCloser 
              data={data?.noShowPorCloser || []} 
              geral={data?.noShowGeral || 0} 
            />
            <HotProposals proposals={data?.propostasQuentes || []} />
            <MonthlySales
              sales={data?.vendasDoMes || []}
              totalMRR={data?.vendasMRR || 0}
              totalProjeto={data?.vendasProjeto || 0}
            />
          </div>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-6">
          <LeadsToWorkSection
            leadsRemarcar={data?.leadsRemarcar || 0}
            leadsNovo={data?.leadsNovo || 0}
            leadsEmContato={data?.leadsEmContato || 0}
            total={data?.leadsParaTrabalhar || 0}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Leads to Work Section Component
function LeadsToWorkSection({ 
  leadsRemarcar, 
  leadsNovo, 
  leadsEmContato,
  total 
}: { 
  leadsRemarcar: number; 
  leadsNovo: number; 
  leadsEmContato: number;
  total: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-8 rounded-2xl border-2 ${
          total > 20 
            ? "bg-gradient-to-br from-destructive/20 to-red-600/10 border-destructive/50" 
            : total > 10 
              ? "bg-gradient-to-br from-amber-500/20 to-orange-600/10 border-amber-500/50"
              : "bg-gradient-to-br from-success/20 to-emerald-600/10 border-success/50"
        }`}
      >
        <p className="text-lg text-muted-foreground mb-2">Total de Leads</p>
        <p className={`text-7xl font-black ${
          total > 20 ? "text-destructive" : total > 10 ? "text-amber-500" : "text-success"
        }`}>
          {total}
        </p>
        <p className="text-sm text-muted-foreground mt-2">para trabalhar</p>
      </motion.div>

      {/* Remarcar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="p-8 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30"
      >
        <p className="text-lg text-muted-foreground mb-2">Remarcar</p>
        <p className="text-6xl font-black text-orange-500">{leadsRemarcar}</p>
        <p className="text-sm text-muted-foreground mt-2">reuniões a remarcar</p>
      </motion.div>

      {/* Novo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30"
      >
        <p className="text-lg text-muted-foreground mb-2">Novo</p>
        <p className="text-6xl font-black text-blue-500">{leadsNovo}</p>
        <p className="text-sm text-muted-foreground mt-2">leads novos no funil</p>
      </motion.div>

      {/* Em Contato */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="p-8 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-400/30"
      >
        <p className="text-lg text-muted-foreground mb-2">Em Contato</p>
        <p className="text-6xl font-black text-amber-400">{leadsEmContato}</p>
        <p className="text-sm text-muted-foreground mt-2">aguardando resposta</p>
      </motion.div>
    </div>
  );
}
