import { motion } from "framer-motion";
import { DollarSign, Target, Flame, CheckCircle } from "lucide-react";
import { useCurrentTeamMember } from "@/hooks/useTeamMembers";
import { useCommissionSummary } from "@/hooks/useCommissions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Hook para buscar confirmações do SDR no mês atual
function useSDRConfirmations(sdrId: string | undefined) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  return useQuery({
    queryKey: ["sdr_confirmations", sdrId, month, year],
    queryFn: async () => {
      if (!sdrId) return { confirmed: 0, goal: 0 };
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      // Buscar confirmações do mês (status compareceu)
      const { data: confirmations, error: confError } = await supabase
        .from("pipe_confirmacao")
        .select("id")
        .eq("sdr_id", sdrId)
        .eq("status", "compareceu")
        .gte("meeting_date", startDate.toISOString())
        .lte("meeting_date", endDate.toISOString());
      
      if (confError) throw confError;
      
      // Buscar meta do SDR (tipo "reunioes" conforme cadastrado em Gestão de Metas)
      const { data: goal } = await supabase
        .from("goals")
        .select("target_value, created_at")
        .eq("team_member_id", sdrId)
        .eq("month", month)
        .eq("year", year)
        .eq("type", "reunioes")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return {
        confirmed: confirmations?.length || 0,
        goal: Number(goal?.target_value) || 20, // Default 20 se não tiver meta
      };
    },
    enabled: !!sdrId,
  });
}

// Hook para buscar vendas do Closer no mês atual
function useCloserSales(closerId: string | undefined) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  return useQuery({
    queryKey: ["closer_sales_count", closerId, month, year],
    queryFn: async () => {
      if (!closerId) return { sales: 0, goal: 0 };
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      // Buscar vendas do mês
      const { data: sales, error: salesError } = await supabase
        .from("pipe_propostas")
        .select("id")
        .eq("closer_id", closerId)
        .eq("status", "vendido")
        .gte("closed_at", startDate.toISOString())
        .lte("closed_at", endDate.toISOString());
      
      if (salesError) throw salesError;
      
      // Buscar meta do Closer (tipo "vendas" conforme cadastrado em Gestão de Metas)
      const { data: goal } = await supabase
        .from("goals")
        .select("target_value, created_at")
        .eq("team_member_id", closerId)
        .eq("month", month)
        .eq("year", year)
        .eq("type", "vendas")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return {
        sales: sales?.length || 0,
        goal: Number(goal?.target_value) || 10, // Default 10 se não tiver meta
      };
    },
    enabled: !!closerId,
  });
}

interface SidebarPerformanceWidgetProps {
  collapsed: boolean;
}

export function SidebarPerformanceWidget({ collapsed }: SidebarPerformanceWidgetProps) {
  const { data: currentMember, isLoading: memberLoading } = useCurrentTeamMember();
  
  // Use role from team_member instead of user_roles table
  const memberRole = currentMember?.role;
  
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  const { data: commissionSummary, isLoading: commissionLoading } = useCommissionSummary(
    currentMember?.id || "",
    month,
    year
  );
  
  const { data: sdrData, isLoading: sdrLoading } = useSDRConfirmations(
    memberRole === "sdr" ? currentMember?.id : undefined
  );
  
  const { data: closerSales, isLoading: closerSalesLoading } = useCloserSales(
    memberRole === "closer" ? currentMember?.id : undefined
  );
  
  // Admin não vê o widget
  if (memberRole === "admin") return null;
  
  // Se não tem membro associado, não mostra
  if (!currentMember && !memberLoading) return null;
  
  const isLoading = memberLoading || commissionLoading || sdrLoading || closerSalesLoading;
  
  if (isLoading) {
    return (
      <div className="p-3 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3 animate-pulse">
          <div className="h-4 bg-sidebar-border rounded w-20 mb-2" />
          <div className="h-6 bg-sidebar-border rounded w-24" />
        </div>
      </div>
    );
  }
  
  // Widget para SDR
  if (memberRole === "sdr" && sdrData) {
    const percentage = sdrData.goal > 0 ? (sdrData.confirmed / sdrData.goal) * 100 : 0;
    const isOnTrack = percentage >= 50;
    
    return (
      <div className="p-3 border-t border-sidebar-border">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-lg p-3 bg-gradient-to-br ${
            isOnTrack 
              ? "from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30" 
              : "from-amber-500/20 to-amber-600/10 border border-amber-500/30"
          }`}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-1">
              <CheckCircle className={`w-5 h-5 ${isOnTrack ? "text-emerald-400" : "text-amber-400"}`} />
              <span className={`text-sm font-bold ${isOnTrack ? "text-emerald-400" : "text-amber-400"}`}>
                {sdrData.confirmed}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className={`w-4 h-4 ${isOnTrack ? "text-emerald-400" : "text-amber-400"}`} />
                <span className="text-xs font-medium text-sidebar-foreground/70">Confirmados</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${isOnTrack ? "text-emerald-400" : "text-amber-400"}`}>
                  {sdrData.confirmed}
                </span>
                <span className="text-sm text-sidebar-foreground/50">/ {sdrData.goal}</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-sidebar-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full rounded-full ${isOnTrack ? "bg-emerald-400" : "bg-amber-400"}`}
                />
              </div>
              <p className="text-xs text-sidebar-foreground/50 mt-1">
                {percentage.toFixed(0)}% da meta
              </p>
            </>
          )}
        </motion.div>
      </div>
    );
  }
  
  // Widget para Closer
  if (memberRole === "closer" && commissionSummary && closerSales) {
    // Usar porcentagem baseada nas vendas vs meta (closerSales), não commissionSummary.goalProgress
    const percentage = closerSales.goal > 0 ? (closerSales.sales / closerSales.goal) * 100 : 0;
    const isOnTrack = percentage >= 70;
    
    return (
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* Ganhos do mês */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-lg p-3 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-1">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-primary">
                {formatCurrency(commissionSummary.totalEarnings).replace("R$", "")}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-sidebar-foreground/70">Ganhos do Mês</span>
              </div>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-xl font-bold text-primary"
              >
                {formatCurrency(commissionSummary.totalEarnings)}
              </motion.div>
              <div className="flex items-center gap-2 mt-1 text-xs text-sidebar-foreground/50">
                <span>OTE: {formatCurrency(commissionSummary.oteBase + commissionSummary.calculatedBonus)}</span>
                <span>•</span>
                <span>Comissão: {formatCurrency(commissionSummary.totalCommission)}</span>
              </div>
            </>
          )}
        </motion.div>
        
        {/* Vendas vs Meta */}
        {!collapsed && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`rounded-lg p-3 bg-gradient-to-br ${
              isOnTrack 
                ? "from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30" 
                : "from-amber-500/20 to-amber-600/10 border border-amber-500/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Target className={`w-4 h-4 ${isOnTrack ? "text-emerald-400" : "text-amber-400"}`} />
              <span className="text-xs font-medium text-sidebar-foreground/70">Vendas</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-lg font-bold ${isOnTrack ? "text-emerald-400" : "text-amber-400"}`}>
                {closerSales.sales}
              </span>
              <span className="text-sm text-sidebar-foreground/50">/ {closerSales.goal}</span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-sidebar-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${isOnTrack ? "bg-emerald-400" : "bg-amber-400"}`}
              />
            </div>
            <p className="text-xs text-sidebar-foreground/50 mt-1">
              {percentage.toFixed(0)}% da meta
            </p>
          </motion.div>
        )}
      </div>
    );
  }
  
  return null;
}
