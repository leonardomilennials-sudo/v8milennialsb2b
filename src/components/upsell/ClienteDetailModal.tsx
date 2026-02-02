import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUpdateUpsellClient, useUpsellProdutos, UpsellClient, tipoClienteTempoLabels } from "@/hooks/useUpsell";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Package, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClienteDetailModalProps {
  client: UpsellClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteDetailModal({ client, open, onOpenChange }: ClienteDetailModalProps) {
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: products = [] } = useProducts();
  const { data: clientProducts = [] } = useUpsellProdutos(client?.id);
  const updateClient = useUpdateUpsellClient();

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [nomeCliente, setNomeCliente] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [setor, setSetor] = useState("");
  const [tipoCliente, setTipoCliente] = useState("outro");
  const [tipoClienteTempo, setTipoClienteTempo] = useState("onboarding");
  const [responsavelInterno, setResponsavelInterno] = useState("");
  const [mrrAtual, setMrrAtual] = useState("");
  const [ltvAtual, setLtvAtual] = useState("");
  const [potencialExpansao, setPotencialExpansao] = useState("medio");

  useEffect(() => {
    if (client) {
      setNomeCliente(client.nome_cliente);
      setCnpj(client.cnpj || "");
      setSetor(client.setor || "");
      setTipoCliente(client.tipo_cliente || "outro");
      setTipoClienteTempo(client.tipo_cliente_tempo || "onboarding");
      setResponsavelInterno(client.responsavel_interno || "");
      setMrrAtual(client.mrr_atual?.toString() || "0");
      setLtvAtual(client.ltv_atual?.toString() || "0");
      setPotencialExpansao(client.potencial_expansao || "medio");
    }
  }, [client]);

  const handleSave = async () => {
    if (!client) return;

    setLoading(true);
    try {
      await updateClient.mutateAsync({
        id: client.id,
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

      toast.success("Cliente atualizado!");
      setEditMode(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar cliente");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (!client) return null;

  const activeProducts = clientProducts.filter((p) => p.status === "ativo");
  const eligibleProducts = clientProducts.filter((p) => p.status === "elegivel");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{client.nome_cliente}</span>
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "Visualizar" : "Editar"}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Cliente</Label>
                    <Input
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Setor</Label>
                    <Input value={setor} onChange={(e) => setSetor(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
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
                    <Label>Estágio</Label>
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
                    <Label>Responsável</Label>
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
                    <Label>MRR Atual</Label>
                    <Input
                      type="number"
                      value={mrrAtual}
                      onChange={(e) => setMrrAtual(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>LTV Atual</Label>
                    <Input
                      type="number"
                      value={ltvAtual}
                      onChange={(e) => setLtvAtual(e.target.value)}
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
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{client.cnpj || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Setor</p>
                    <p className="font-medium">{client.setor || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Cliente</p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {client.tipo_cliente || "outro"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estágio</p>
                    <Badge className="mt-1 bg-primary/20 text-primary">
                      {tipoClienteTempoLabels[client.tipo_cliente_tempo] || client.tipo_cliente_tempo}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Responsável Interno</p>
                    <p className="font-medium">{client.responsavel?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Primeira Venda</p>
                    <p className="font-medium">
                      {client.data_primeira_venda
                        ? format(new Date(client.data_primeira_venda), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="metricas" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-full bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">MRR Atual</p>
                    <p className="text-xl font-bold">{formatCurrency(client.mrr_atual || 0)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-500/10">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">LTV Atual</p>
                    <p className="text-xl font-bold">{formatCurrency(client.ltv_atual || 0)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-full bg-purple-500/10">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">LTV Projetado</p>
                    <p className="text-xl font-bold">{formatCurrency(client.ltv_projetado || 0)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-full bg-orange-500/10">
                    <Calendar className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo de Contrato</p>
                    <p className="text-xl font-bold">{client.tempo_contrato_meses || 0} meses</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="produtos" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produtos Ativos ({activeProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum produto ativo</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activeProducts.map((p) => (
                      <Badge key={p.id} className="bg-green-500/20 text-green-400">
                        {p.product?.name || "Produto"}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produtos Elegíveis ({eligibleProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eligibleProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum produto elegível</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {eligibleProducts.map((p) => (
                      <Badge key={p.id} variant="outline">
                        {p.product?.name || "Produto"}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
