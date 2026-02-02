import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUpsellClients, useCreateUpsellClient, useCreateUpsellCampanha, tipoClienteTempoLabels, tipoAcaoLabels, canalLabels } from "@/hooks/useUpsell";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreateUpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMonth: number;
  selectedYear: number;
}

export function CreateUpsellModal({ open, onOpenChange, selectedMonth, selectedYear }: CreateUpsellModalProps) {
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: existingClients = [] } = useUpsellClients();
  const createClient = useCreateUpsellClient();
  const createCampanha = useCreateUpsellCampanha();

  const [tab, setTab] = useState<"novo" | "existente">("novo");
  const [loading, setLoading] = useState(false);

  // Form state for new client
  const [nomeCliente, setNomeCliente] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [setor, setSetor] = useState("");
  const [tipoCliente, setTipoCliente] = useState("outro");
  const [tipoClienteTempo, setTipoClienteTempo] = useState("onboarding");
  const [responsavelInterno, setResponsavelInterno] = useState("");
  const [mrrAtual, setMrrAtual] = useState("");
  const [ltvAtual, setLtvAtual] = useState("");
  const [potencialExpansao, setPotencialExpansao] = useState("medio");

  // Form state for campanha
  const [selectedClientId, setSelectedClientId] = useState("");
  const [tipoAcao, setTipoAcao] = useState("upsell_ativacao");
  const [canal, setCanal] = useState("manual");
  const [campanhaNome, setCampanhaNome] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const resetForm = () => {
    setNomeCliente("");
    setCnpj("");
    setSetor("");
    setTipoCliente("outro");
    setTipoClienteTempo("onboarding");
    setResponsavelInterno("");
    setMrrAtual("");
    setLtvAtual("");
    setPotencialExpansao("medio");
    setSelectedClientId("");
    setTipoAcao("upsell_ativacao");
    setCanal("manual");
    setCampanhaNome("");
    setObservacoes("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let clientId = selectedClientId;

      if (tab === "novo") {
        if (!nomeCliente.trim()) {
          toast.error("Nome do cliente é obrigatório");
          return;
        }

        const newClient = await createClient.mutateAsync({
          nome_cliente: nomeCliente,
          cnpj: cnpj || null,
          setor: setor || null,
          tipo_cliente: tipoCliente as any,
          tipo_cliente_tempo: tipoClienteTempo as any,
          responsavel_interno: responsavelInterno || null,
          mrr_atual: parseFloat(mrrAtual) || 0,
          ltv_atual: parseFloat(ltvAtual) || 0,
          potencial_expansao: potencialExpansao as any,
        });
        clientId = newClient.id;
      }

      if (!clientId) {
        toast.error("Selecione ou crie um cliente");
        return;
      }

      await createCampanha.mutateAsync({
        upsell_client_id: clientId,
        mes: selectedMonth,
        ano: selectedYear,
        tipo_acao: tipoAcao as any,
        canal: canal as any,
        campanha_nome: campanhaNome || null,
        observacoes: observacoes || null,
        status: "planejado",
        responsavel_fechamento: responsavelInterno || null,
      });

      toast.success("Upsell criado com sucesso!");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar upsell");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Upsell - {selectedMonth}/{selectedYear}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="novo">Novo Cliente</TabsTrigger>
            <TabsTrigger value="existente">Cliente Existente</TabsTrigger>
          </TabsList>

          <TabsContent value="novo" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Cliente *</Label>
                <Input
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Setor / Nicho</Label>
                <Input
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  placeholder="Ex: Tecnologia, Varejo..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Cliente</Label>
                <Select value={tipoCliente} onValueChange={setTipoCliente}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fabrica">Fábrica</SelectItem>
                    <SelectItem value="distribuidora">Distribuidora</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo por Tempo</Label>
                <Select value={tipoClienteTempo} onValueChange={setTipoClienteTempo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoClienteTempoLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável Interno</Label>
                <Select value={responsavelInterno} onValueChange={setResponsavelInterno}>
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>MRR Atual (R$)</Label>
                <Input
                  type="number"
                  value={mrrAtual}
                  onChange={(e) => setMrrAtual(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>LTV Atual (R$)</Label>
                <Input
                  type="number"
                  value={ltvAtual}
                  onChange={(e) => setLtvAtual(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Potencial</Label>
                <Select value={potencialExpansao} onValueChange={setPotencialExpansao}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="existente" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Selecionar Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {existingClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_cliente} {c.setor && `(${c.setor})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        {/* Campanha Fields */}
        <div className="border-t pt-4 mt-4 space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground">Planejamento da Campanha</h4>
          
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

          <div className="space-y-2">
            <Label>Nome da Campanha (opcional)</Label>
            <Input
              value={campanhaNome}
              onChange={(e) => setCampanhaNome(e.target.value)}
              placeholder="Ex: Black Friday, Renovação Q1..."
            />
          </div>

          <div className="space-y-2">
            <Label>Observações Estratégicas</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Notas sobre o cliente, estratégia de abordagem..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Criando..." : "Criar Upsell"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
