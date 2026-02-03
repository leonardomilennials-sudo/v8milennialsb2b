import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { upsellStatusColumns, tipoClienteTempoLabels } from "@/hooks/useUpsell";
import { Search } from "lucide-react";

interface UpsellFiltersProps {
  selectedMonth: number;
  selectedYear: number;
  selectedStatus: string;
  selectedTipoTempo: string;
  selectedPotencial: string;
  selectedResponsavel: string;
  selectedFaturamento?: string;
  searchQuery?: string;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onStatusChange: (status: string) => void;
  onTipoTempoChange: (tipo: string) => void;
  onPotencialChange: (potencial: string) => void;
  onResponsavelChange: (responsavel: string) => void;
  onFaturamentoChange?: (faturamento: string) => void;
  onSearchChange?: (query: string) => void;
}

const months = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

const potencialOptions = [
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Médio" },
  { value: "alto", label: "Alto" },
];

const faturamentoOptions = [
  { value: "ate_100k", label: "Até R$ 100k" },
  { value: "100k_500k", label: "R$ 100k - 500k" },
  { value: "500k_1m", label: "R$ 500k - 1M" },
  { value: "1m_5m", label: "R$ 1M - 5M" },
  { value: "acima_5m", label: "Acima de R$ 5M" },
];

export function UpsellFilters({
  selectedMonth,
  selectedYear,
  selectedStatus,
  selectedTipoTempo,
  selectedPotencial,
  selectedResponsavel,
  selectedFaturamento = "all",
  searchQuery = "",
  onMonthChange,
  onYearChange,
  onStatusChange,
  onTipoTempoChange,
  onPotencialChange,
  onResponsavelChange,
  onFaturamentoChange,
  onSearchChange,
}: UpsellFiltersProps) {
  const { data: teamMembers = [] } = useTeamMembers();

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Busca por Nome */}
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-[180px] pl-9"
          />
        </div>
      )}

      {/* Mês */}
      <Select value={String(selectedMonth)} onValueChange={(v) => onMonthChange(Number(v))}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={String(m.value)}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Ano */}
      <Select value={String(selectedYear)} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          {upsellStatusColumns.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tipo Cliente (Tempo) */}
      <Select value={selectedTipoTempo} onValueChange={onTipoTempoChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tipo Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Tipos</SelectItem>
          {Object.entries(tipoClienteTempoLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Potencial */}
      <Select value={selectedPotencial} onValueChange={onPotencialChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Potencial" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {potencialOptions.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Faturamento */}
      {onFaturamentoChange && (
        <Select value={selectedFaturamento} onValueChange={onFaturamentoChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Faturamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {faturamentoOptions.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Responsável */}
      <Select value={selectedResponsavel} onValueChange={onResponsavelChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {teamMembers.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
