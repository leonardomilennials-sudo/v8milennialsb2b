import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import type { Lead } from "@/components/kanban/KanbanCard";

const mockLeads: Lead[] = [
  {
    id: "1",
    name: "Carlos Oliveira",
    company: "TechFab Indústria",
    email: "carlos@techfab.com",
    meetingDate: "08 Jan, 14:00",
    rating: 4,
    origin: "calendly",
    sdr: "Lucas M.",
    closer: "Maria S.",
    tags: ["Fábrica", "Alto Faturamento"],
    revenue: "R$ 2M+",
    segment: "Metalúrgica",
  },
  {
    id: "2",
    name: "Fernanda Lima",
    company: "Distribuidora Norte",
    email: "fernanda@distnorte.com",
    meetingDate: "08 Jan, 15:30",
    rating: 5,
    origin: "whatsapp",
    sdr: "Julia F.",
    closer: "João S.",
    tags: ["Distribuidora", "Urgente"],
    revenue: "R$ 5M+",
    segment: "Alimentos",
  },
  {
    id: "3",
    name: "Roberto Mendes",
    company: "Fab Metal SA",
    meetingDate: "09 Jan, 10:00",
    rating: 3,
    origin: "calendly",
    sdr: "Rafael C.",
    tags: ["Fábrica"],
    segment: "Aço",
  },
  {
    id: "4",
    name: "Amanda Costa",
    company: "Log Express",
    meetingDate: "09 Jan, 11:00",
    rating: 4,
    origin: "outro",
    sdr: "Lucas M.",
    closer: "Ana C.",
    tags: ["Distribuidora", "B2B"],
  },
  {
    id: "5",
    name: "Marcelo Santos",
    company: "Indústria Premium",
    meetingDate: "09 Jan, 14:00",
    rating: 5,
    origin: "calendly",
    sdr: "Julia F.",
    closer: "Maria S.",
    tags: ["Fábrica", "Alto Faturamento", "Urgente"],
    revenue: "R$ 10M+",
  },
];

const columns = [
  {
    id: "reuniao-marcada",
    title: "Reunião Marcada",
    color: "#6366f1",
    leads: mockLeads.slice(0, 2),
  },
  {
    id: "confirmar-d3",
    title: "Confirmar D-3",
    color: "#f59e0b",
    leads: [mockLeads[2]],
  },
  {
    id: "confirmar-d1",
    title: "Confirmar D-1",
    color: "#f59e0b",
    leads: [mockLeads[3]],
  },
  {
    id: "pre-confirmada",
    title: "Pré Confirmada",
    color: "#10b981",
    leads: [],
  },
  {
    id: "confirmacao-no-dia",
    title: "Confirmação | No dia",
    color: "#3b82f6",
    leads: [mockLeads[4]],
  },
  {
    id: "confirmada-no-dia",
    title: "Confirmada | No dia",
    color: "#22c55e",
    leads: [],
  },
  {
    id: "compareceu",
    title: "Compareceu ✓",
    color: "#16a34a",
    leads: [],
  },
  {
    id: "perdido",
    title: "Perdido ✗",
    color: "#ef4444",
    leads: [],
  },
];

export default function PipeConfirmacao() {
  const [searchQuery, setSearchQuery] = useState("");

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
          <Button variant="secondary" size="sm">
            Todos
          </Button>
          <Button variant="ghost" size="sm">
            Calendly
          </Button>
          <Button variant="ghost" size="sm">
            WhatsApp
          </Button>
          <Button variant="ghost" size="sm">
            Hoje
          </Button>
          <Button variant="ghost" size="sm">
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
          <p className="text-2xl font-bold mt-1">12</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Confirmadas</p>
          <p className="text-2xl font-bold text-success mt-1">8</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold text-warning mt-1">3</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Taxa Confirmação</p>
          <p className="text-2xl font-bold text-primary mt-1">67%</p>
        </div>
      </motion.div>

      {/* Kanban Board */}
      <KanbanBoard columns={columns} />
    </div>
  );
}
