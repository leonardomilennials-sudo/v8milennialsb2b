import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, MoreHorizontal, Calendar, User, Building2, Star, DollarSign, Clock, Tag, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePipePropostas, statusColumns as propostaStatusColumns } from "@/hooks/usePipePropostas";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Proposal {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  rating: number;
  closer?: string;
  closerId?: string;
  productType: "mrr" | "projeto" | null;
  value: number;
  contractDuration: number;
  tags: string[];
  lastContact?: string;
  segment?: string;
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="kanban-card group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {proposal.name}
          </h4>
          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
            <Building2 className="w-3 h-3" />
            <span className="text-xs truncate">{proposal.company}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 ml-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < proposal.rating
                  ? "text-primary fill-primary"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Product Type & Value */}
      <div className="flex items-center gap-2 mb-3">
        {proposal.productType && (
          <Badge
            variant="outline"
            className={
              proposal.productType === "mrr"
                ? "bg-chart-5/10 text-chart-5 border-chart-5/20"
                : "bg-primary/10 text-primary border-primary/20"
            }
          >
            {proposal.productType === "mrr" ? "MRR" : "Projeto"}
          </Badge>
        )}
        <div className="flex items-center gap-1 text-success font-semibold text-sm">
          <DollarSign className="w-3.5 h-3.5" />
          {formatCurrency(proposal.value)}
          {proposal.productType === "mrr" && <span className="text-xs font-normal text-muted-foreground">/mês</span>}
        </div>
      </div>

      {/* Contract Duration */}
      {proposal.contractDuration > 0 && (
        <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs">Contrato: {proposal.contractDuration} meses</span>
        </div>
      )}

      {/* Tags */}
      {proposal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {proposal.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {proposal.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{proposal.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Last Contact & Closer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        {proposal.lastContact && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{proposal.lastContact}</span>
          </div>
        )}
        {proposal.closer && (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{proposal.closer}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function PipePropostas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCloser, setFilterCloser] = useState("all");
  const [filterProductType, setFilterProductType] = useState("all");

  const { data: pipeData, isLoading } = usePipePropostas();
  const { data: teamMembers } = useTeamMembers();

  const closers = useMemo(() => {
    return teamMembers?.filter(m => m.role === "closer" && m.is_active) || [];
  }, [teamMembers]);

  // Transform pipe data to Proposal format
  const transformToProposal = (item: any): Proposal => {
    const lead = item.lead;
    return {
      id: item.id,
      name: lead?.name || "Sem nome",
      company: lead?.company || "Sem empresa",
      email: lead?.email,
      phone: lead?.phone,
      rating: lead?.rating || 0,
      closer: item.closer?.name || lead?.closer?.name,
      closerId: item.closer_id,
      productType: item.product_type,
      value: item.sale_value || 0,
      contractDuration: item.contract_duration || 0,
      tags: lead?.lead_tags?.map((lt: any) => lt.tag?.name).filter(Boolean) || [],
      lastContact: item.commitment_date 
        ? format(new Date(item.commitment_date), "dd/MM", { locale: ptBR })
        : undefined,
      segment: lead?.segment,
    };
  };

  // Organize data by status columns
  const columns = useMemo(() => {
    if (!pipeData) return propostaStatusColumns.map(col => ({ ...col, proposals: [] as Proposal[] }));

    return propostaStatusColumns.map(col => {
      const columnItems = pipeData
        .filter(item => item.status === col.id)
        .filter(item => {
          const lead = item.lead;
          
          // Search filter
          const matchesSearch = searchTerm === "" || 
            lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead?.company?.toLowerCase().includes(searchTerm.toLowerCase());
          
          // Closer filter
          const matchesCloser = filterCloser === "all" || item.closer_id === filterCloser;
          
          // Product type filter
          const matchesType = filterProductType === "all" || item.product_type === filterProductType;
          
          return matchesSearch && matchesCloser && matchesType;
        })
        .map(transformToProposal);

      return {
        ...col,
        proposals: columnItems,
      };
    });
  }, [pipeData, searchTerm, filterCloser, filterProductType]);

  // Calculate totals
  const stats = useMemo(() => {
    if (!pipeData) return { total: 0, sold: 0, mrr: 0, projeto: 0 };

    const total = pipeData.reduce((sum, item) => sum + (item.sale_value || 0), 0);
    const sold = pipeData
      .filter(item => item.status === "vendido")
      .reduce((sum, item) => sum + (item.sale_value || 0), 0);
    const mrr = pipeData
      .filter(item => item.product_type === "mrr")
      .reduce((sum, item) => sum + (item.sale_value || 0), 0);
    const projeto = pipeData
      .filter(item => item.product_type === "projeto")
      .reduce((sum, item) => sum + (item.sale_value || 0), 0);

    return { total, sold, mrr, projeto };
  }, [pipeData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

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
          <h1 className="text-2xl font-bold">Gestão de Propostas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pipeline de negociação e fechamento de vendas
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Proposta
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">Pipeline Total</p>
          <p className="text-xl font-bold">{formatCurrency(stats.total)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">Vendido</p>
          <p className="text-xl font-bold text-success">{formatCurrency(stats.sold)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">MRR Total</p>
          <p className="text-xl font-bold text-chart-5">{formatCurrency(stats.mrr)}</p>
          <p className="text-xs text-muted-foreground">/mês</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">Projetos</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(stats.projeto)}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proposta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCloser} onValueChange={setFilterCloser}>
          <SelectTrigger className="w-[180px]">
            <User className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Closer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Closers</SelectItem>
            {closers.map(closer => (
              <SelectItem key={closer.id} value={closer.id}>{closer.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterProductType} onValueChange={setFilterProductType}>
          <SelectTrigger className="w-[160px]">
            <Tag className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="mrr">MRR</SelectItem>
            <SelectItem value="projeto">Projeto</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Mais Filtros
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column, colIndex) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: colIndex * 0.05 }}
            className="kanban-column min-w-[300px] max-w-[320px] flex-shrink-0"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                  {column.proposals.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg hover:bg-background transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-background transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Column Value Summary */}
            <div className="mb-3 p-2 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">
                Total:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(
                    column.proposals.reduce((sum, p) => sum + p.value, 0)
                  )}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              {column.proposals.map((proposal, proposalIndex) => (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: proposalIndex * 0.03 }}
                >
                  <ProposalCard proposal={proposal} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
