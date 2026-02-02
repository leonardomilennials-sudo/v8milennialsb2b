import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useCreateUpsellClient, tipoClienteTempoLabels } from "@/hooks/useUpsell";
import { toast } from "sonner";

interface CreateClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClienteModal({ open, onOpenChange }: CreateClienteModalProps) {
  const { data: teamMembers = [] } = useTeamMembers();
  const createClient = useCreateUpsellClient();

  const [loading, setLoading] = useState(false);
  const [nomeCliente, setNomeCliente] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [setor, setSetor] = useState("");
  const [tipoCliente, setTipoCliente] = useState("outro");
  const [tipoClienteTempo, setTipoClienteTempo] = useState("onboarding");
  const [responsavelInterno, setResponsavelInterno] = useState("");
  const [mrrAtual, setMrrAtual] = useState("");
  const [ltvAtual, setLtvAtual] = useState("");
  const [potencialExpansao, setPotencialExpansao] = useState("medio");

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
  };

  const handleSubmit = async () => {
    if (!nomeCliente.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }

    setLoading(true);
    try {
      await createClient.mutateAsync({
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

      toast.success("Cliente criado com sucesso!");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
              <Label>Estágio do Cliente</Label>
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
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Criando..." : "Criar Cliente"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
