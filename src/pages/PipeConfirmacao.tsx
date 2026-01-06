import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, Calendar, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { usePipeConfirmacao, statusColumns, useUpdatePipeConfirmacao } from "@/hooks/usePipeConfirmacao";
import type { Lead } from "@/components/kanban/KanbanCard";
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

type OriginFilter = "all" | "calendly" | "whatsapp" | "today" | "week";

export default function PipeConfirmacao() {
  const [searchQuery, setSearchQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all");
  
  const { data: pipeData, isLoading } = usePipeConfirmacao();

  // Transform pipe data to Lead format for KanbanCard
  const transformToLead = (item: any): Lead => {
    const lead = item.lead;
    return {
      id: item.id,
      name: lead?.name || "Sem nome",
      company: lead?.company || "Sem empresa",
      email: lead?.email,
      phone: lead?.phone,
      meetingDate: item.meeting_date 
        ? format(new Date(item.meeting_date), "dd MMM, HH:mm", { locale: ptBR })
        : undefined,
      rating: lead?.rating || 0,
      origin: lead?.origin || "outro",
      sdr: item.sdr?.name || lead?.sdr?.name,
      closer: item.closer?.name || lead?.closer?.name,
      tags: lead?.lead_tags?.map((lt: any) => lt.tag?.name).filter(Boolean) || [],
      revenue: lead?.faturamento ? `R$ ${(lead.faturamento / 1000000).toFixed(1)}M+` : undefined,
      segment: lead?.segment,
    };
  };

  // Filter and organize data by status columns
  const columns = useMemo(() => {
    if (!pipeData) return statusColumns.map(col => ({ ...col, leads: [] }));

    const now = new Date();
    const weekStart = startOfWeek(now, { locale: ptBR });
    const weekEnd = endOfWeek(now, { locale: ptBR });

    return statusColumns.map(col => {
      const columnItems = pipeData
        .filter(item => item.status === col.id)
        .filter(item => {
          const lead = item.lead;
          
          // Search filter
          const matchesSearch = searchQuery === "" || 
            lead?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead?.company?.toLowerCase().includes(searchQuery.toLowerCase());
          
          // Origin filter
          let matchesOrigin = true;
          if (originFilter === "calendly") {
            matchesOrigin = lead?.origin === "calendly";
          } else if (originFilter === "whatsapp") {
            matchesOrigin = lead?.origin === "whatsapp";
          } else if (originFilter === "today" && item.meeting_date) {
            matchesOrigin = isToday(new Date(item.meeting_date));
          } else if (originFilter === "week" && item.meeting_date) {
            matchesOrigin = isWithinInterval(new Date(item.meeting_date), { start: weekStart, end: weekEnd });
          }
          
          return matchesSearch && matchesOrigin;
        })
        .map(transformToLead);

      return {
        ...col,
        leads: columnItems,
      };
    });
  }, [pipeData, searchQuery, originFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!pipeData) return { today: 0, confirmed: 0, pending: 0, rate: 0 };

    const todayMeetings = pipeData.filter(item => 
      item.meeting_date && isToday(new Date(item.meeting_date))
    );
    
    const confirmed = pipeData.filter(item => 
      ["confirmada_no_dia", "compareceu"].includes(item.status)
    ).length;
    
    const pending = pipeData.filter(item => 
      ["reuniao_marcada", "confirmar_d3", "confirmar_d1", "pre_confirmada", "confirmacao_no_dia"].includes(item.status)
    ).length;
    
    const total = pipeData.length;
    const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

    return {
      today: todayMeetings.length,
      confirmed,
      pending,
      rate,
    };
  }, [pipeData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold flex items-center gap-2"
          >
            <Calendar className="w-6 h-6 text-primary" />
            Confirmação de Reunião
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o comparecimento das reuniões agendadas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm" className="gradient-gold">
            <Plus className="w-4 h-4 mr-2" />
            Nova Reunião
          </Button>
        </div>
      </div>

      {/* Search & Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lead, empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={originFilter === "all" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setOriginFilter("all")}
          >
            Todos
          </Button>
          <Button 
            variant={originFilter === "calendly" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setOriginFilter("calendly")}
          >
            Calendly
          </Button>
          <Button 
            variant={originFilter === "whatsapp" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setOriginFilter("whatsapp")}
          >
            WhatsApp
          </Button>
          <Button 
            variant={originFilter === "today" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setOriginFilter("today")}
          >
            Hoje
          </Button>
          <Button 
            variant={originFilter === "week" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setOriginFilter("week")}
          >
            Esta Semana
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Reuniões Hoje</p>
          <p className="text-2xl font-bold mt-1">{stats.today}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Confirmadas</p>
          <p className="text-2xl font-bold text-success mt-1">{stats.confirmed}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats.pending}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Taxa Confirmação</p>
          <p className="text-2xl font-bold text-primary mt-1">{stats.rate}%</p>
        </div>
      </motion.div>

      {/* Kanban Board */}
      <KanbanBoard columns={columns} />
    </div>
  );
}
