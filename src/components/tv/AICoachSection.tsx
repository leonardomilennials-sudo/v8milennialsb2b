import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, RefreshCw, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { usePipeConfirmacao } from "@/hooks/usePipeConfirmacao";
import { usePipePropostas } from "@/hooks/usePipePropostas";
import { useTeamGoals, useIndividualGoals } from "@/hooks/useGoals";

interface TeamMemberTask {
  memberId: string;
  memberName: string;
  role: "sdr" | "closer";
  problema: string;
  tarefa: string;
  isLoading: boolean;
  error: string | null;
}

export function AICoachSection() {
  const [tasks, setTasks] = useState<TeamMemberTask[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: teamMembers } = useTeamMembers();
  const { data: confirmacoes } = usePipeConfirmacao();
  const { data: propostas } = usePipePropostas();
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  const { data: teamGoals } = useTeamGoals(currentMonth, currentYear);
  const { data: individualGoals } = useIndividualGoals(currentMonth, currentYear);
  
  const dayOfMonth = now.getDate();
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  const diasRestantes = lastDayOfMonth - dayOfMonth;

  const fetchTaskForMember = async (member: any) => {
    const role = member.role as "sdr" | "closer";
    
    let metrics: any = { role, diaDoMes: dayOfMonth, diasRestantes };
    
    if (role === "sdr") {
      // SDR metrics: meetings confirmed
      const sdrConfirmacoes = confirmacoes?.filter(c => 
        c.sdr_id === member.id && 
        c.status === "compareceu" &&
        new Date(c.updated_at).getMonth() + 1 === currentMonth
      ) || [];
      
      const sdrGoal = individualGoals?.sdrGoals?.find(g => g.id === member.id);
      
      metrics.confirmados = sdrConfirmacoes.length;
      metrics.metaReuniao = sdrGoal?.goal || 20;
      metrics.percentualMeta = sdrGoal?.percentage || 0;
    } else {
      // Closer metrics: sales
      const closerSales = propostas?.filter(p => 
        p.closer_id === member.id && 
        p.status === "vendido" &&
        new Date(p.closed_at || "").getMonth() + 1 === currentMonth
      ) || [];
      
      const faturamento = closerSales.reduce((sum, p) => sum + (p.sale_value || 0), 0);
      const closerGoal = individualGoals?.closerGoals?.find(g => g.id === member.id);
      
      metrics.faturamento = faturamento;
      metrics.metaVendas = closerGoal?.goal || 50000;
      metrics.numeroVendas = closerSales.length;
      metrics.percentualMetaCloser = closerGoal?.percentage || 0;
    }

    try {
      const { data, error } = await supabase.functions.invoke("oraculo-comercial", {
        body: { metrics }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return {
        memberId: member.id,
        memberName: member.name,
        role,
        problema: data.problema || "",
        tarefa: data.tarefa || "",
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        memberId: member.id,
        memberName: member.name,
        role,
        problema: "",
        tarefa: "",
        isLoading: false,
        error: err.message || "Erro ao consultar IA"
      };
    }
  };

  const fetchAllTasks = async () => {
    if (!teamMembers) return;
    
    setIsRefreshing(true);
    const activeMembers = teamMembers.filter(m => 
      m.is_active && (m.role === "sdr" || m.role === "closer")
    );

    // Initialize loading state
    setTasks(activeMembers.map(m => ({
      memberId: m.id,
      memberName: m.name,
      role: m.role as "sdr" | "closer",
      problema: "",
      tarefa: "",
      isLoading: true,
      error: null
    })));

    // Fetch tasks in parallel (max 3 at a time to avoid rate limits)
    const results: TeamMemberTask[] = [];
    const batchSize = 3;
    
    for (let i = 0; i < activeMembers.length; i += batchSize) {
      const batch = activeMembers.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(fetchTaskForMember));
      results.push(...batchResults);
      
      // Update state incrementally
      setTasks(prev => {
        const updated = [...prev];
        batchResults.forEach(result => {
          const index = updated.findIndex(t => t.memberId === result.memberId);
          if (index !== -1) updated[index] = result;
        });
        return updated;
      });
    }

    setIsRefreshing(false);
  };

  useEffect(() => {
    if (teamMembers && confirmacoes && propostas && individualGoals) {
      fetchAllTasks();
    }
  }, [teamMembers?.length, confirmacoes?.length, propostas?.length]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAllTasks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [teamMembers, confirmacoes, propostas, individualGoals]);

  const closerTasks = tasks.filter(t => t.role === "closer");
  const sdrTasks = tasks.filter(t => t.role === "sdr");

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 via-card/80 to-indigo-600/10 border border-purple-500/30 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Coach IA - Prioridades do Dia</h3>
        </div>
        <button
          onClick={fetchAllTasks}
          disabled={isRefreshing}
          className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-purple-400 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Closers */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">CLOSERS</h4>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
            {closerTasks.map((task, index) => (
              <TaskCard key={task.memberId} task={task} index={index} />
            ))}
            {closerTasks.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhum closer ativo
              </p>
            )}
          </div>
        </div>

        {/* SDRs */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">SDRs</h4>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
            {sdrTasks.map((task, index) => (
              <TaskCard key={task.memberId} task={task} index={index} />
            ))}
            {sdrTasks.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhum SDR ativo
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, index }: { task: TeamMemberTask; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-3 rounded-lg bg-card/50 border border-border/50"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
          <User className="w-4 h-4 text-purple-400" />
        </div>
        <span className="font-semibold text-foreground">{task.memberName}</span>
      </div>

      <AnimatePresence mode="wait">
        {task.isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Analisando...</span>
          </motion.div>
        )}

        {task.error && !task.isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-destructive"
          >
            {task.error}
          </motion.div>
        )}

        {!task.isLoading && !task.error && task.tarefa && (
          <motion.div
            key="task"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {task.problema}
              </p>
            </div>
            <div className="flex items-start gap-2 bg-emerald-500/10 rounded-md p-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-300 font-medium leading-relaxed">
                {task.tarefa}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
