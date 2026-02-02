import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUpsellClients, useCreateUpsellCampanha, tipoAcaoLabels, canalLabels } from "@/hooks/useUpsell";
import { toast } from "sonner";
import { Users, DollarSign, TrendingUp, Search } from "lucide-react";

interface CreateCampanhaUpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMonth: number;
  selectedYear: number;
}

export function CreateCampanhaUpsellModal({
  open,
  onOpenChange,
  selectedMonth,
  selectedYear,
}: CreateCampanhaUpsellModalProps) {
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: existingClients = [] } = useUpsellClients();
  const createCampanha = useCreateUpsellCampanha();

  const [loading, setLoading] = useState(false);
  const [searchCliente, setSearchCliente] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [tipoAcao, setTipoAcao] = useState("upsell_ativacao");
  const [canal, setCanal] = useState("manual");
  const [campanhaNome, setCampanhaNome] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [comissaoPercent, setComissaoPercent] = useState("");

  const filteredClients = existingClients.filter(
    (c) =>
      c.nome_cliente.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.setor?.toLowerCase().includes(searchCliente.toLowerCase())
  );

  const selectedClient = existingClients.find((c) => c.id === selectedClientId);

  const resetForm = () => {
    setSearchCliente("");
    setSelectedClientId("");
    setTipoAcao("upsell_ativacao");
    setCanal("manual");
    setCampanhaNome("");
    setObservacoes("");
    setResponsavel("");
    setComissaoPercent("");
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente da base");
      return;
    }

    setLoading(true);
    try {
      await createCampanha.mutateAsync({
        upsell_client_id: selectedClientId,
        mes: selectedMonth,
        ano: selectedYear,
        tipo_acao: tipoAcao as any,
        canal: canal as any,
        campanha_nome: campanhaNome || null,
        observacoes: observacoes || null,
        status: "planejado",
        responsavel_fechamento: responsavel || null,
      });

      toast.success("Campanha de upsell criada com sucesso!");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar campanha");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const getPotencialColor = (potencial: string) => {
    switch (potencial) {
      case "alto":
        return "bg-green-500/20 text-green-400";
      case "medio":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-red-500/20 text-red-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Nova Campanha de Upsell - {selectedMonth}/{selectedYear}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">1. Selecionar Cliente da Base</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Selected Client Card */}
            {selectedClient && (
              <Card className="border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{selectedClient.nome_cliente}</p>
                      <p className="text-sm text-muted-foreground">{selectedClient.setor}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">MRR</p>
                        <p className="font-medium text-green-400">
                          {formatCurrency(selectedClient.mrr_atual || 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Potencial</p>
                        <Badge className={getPotencialColor(selectedClient.potencial_expansao || "medio")}>
                          {selectedClient.potencial_expansao?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Client List */}
            {!selectedClient && searchCliente && (
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {filteredClients.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">Nenhum cliente encontrado</p>
                ) : (
                  filteredClients.slice(0, 5).map((client) => (
                    <div
                      key={client.id}
                      className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setSearchCliente("");
                      }}
                    >
                      <div>
                        <p className="font-medium">{client.nome_cliente}</p>
                        <p className="text-sm text-muted-foreground">{client.setor || "Sem setor"}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(client.mrr_atual || 0)}
                        </span>
                        <Badge className={getPotencialColor(client.potencial_expansao || "medio")} variant="outline">
                          {client.potencial_expansao?.toUpperCase() || "MÉDIO"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {!selectedClient && !searchCliente && (
              <p className="text-sm text-muted-foreground">Digite para buscar um cliente da base</p>
            )}

            {selectedClient && (
              <Button variant="outline" size="sm" onClick={() => setSelectedClientId("")}>
                Trocar cliente
              </Button>
            )}
          </div>

          {/* Campaign Details */}
          <div className="border-t pt-4 space-y-4">
            <Label className="text-base font-semibold">2. Planejamento da Campanha</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Ação</Label>
                <Select value={tipoAcao} onValueChange={setTipoAcao}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoAcaoLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={canal} onValueChange={setCanal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(canalLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável pela Abordagem</Label>
                <Select value={responsavel} onValueChange={setResponsavel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Comissão do Responsável (%)</Label>
                <Input
                  type="number"
                  value={comissaoPercent}
                  onChange={(e) => setComissaoPercent(e.target.value)}
                  placeholder="Ex: 10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome da Campanha (opcional)</Label>
              <Input
                value={campanhaNome}
                onChange={(e) => setCampanhaNome(e.target.value)}
                placeholder="Ex: Expansão Q1, Cross-sell Premium..."
              />
            </div>

            <div className="space-y-2">
              <Label>Observações Estratégicas</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Notas sobre o cliente, estratégia de abordagem, pontos de atenção..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedClientId}>
            {loading ? "Criando..." : "Criar Campanha"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
