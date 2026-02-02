import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useProducts } from "@/hooks/useProducts";
import {
  UpsellCampanha,
  useUpdateUpsellCampanha,
  useUpdateUpsellClient,
  useDeleteUpsellCampanha,
  useUpsellProdutos,
  useCreateUpsellProduto,
  useUpdateUpsellProduto,
  useDeleteUpsellProduto,
  tipoClienteTempoLabels,
  tipoAcaoLabels,
  canalLabels,
  upsellStatusColumns,
} from "@/hooks/useUpsell";
import { toast } from "sonner";
import { Trash2, Plus, Building2, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UpsellDetailModalProps {
  campanha: UpsellCampanha | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpsellDetailModal({ campanha, open, onOpenChange }: UpsellDetailModalProps) {
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: products = [] } = useProducts();
  const updateCampanha = useUpdateUpsellCampanha();
  const updateClient = useUpdateUpsellClient();
  const deleteCampanha = useDeleteUpsellCampanha();

  const { data: clientProdutos = [] } = useUpsellProdutos(campanha?.client?.id);
  const createProduto = useCreateUpsellProduto();
  const updateProduto = useUpdateUpsellProduto();
  const deleteProduto = useDeleteUpsellProduto();

  // Form state
  const [status, setStatus] = useState("");
  const [tipoAcao, setTipoAcao] = useState("");
  const [canal, setCanal] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [valorFechado, setValorFechado] = useState("");
  const [receitaIncremental, setReceitaIncremental] = useState("");
  const [responsavelFechamento, setResponsavelFechamento] = useState("");

  // Client fields
  const [mrrAtual, setMrrAtual] = useState("");
  const [ltvAtual, setLtvAtual] = useState("");
  const [ltvProjetado, setLtvProjetado] = useState("");
  const [potencialExpansao, setPotencialExpansao] = useState("");
  const [tipoClienteTempo, setTipoClienteTempo] = useState("");

  // Product add state
  const [newProductId, setNewProductId] = useState("");
  const [newProductStatus, setNewProductStatus] = useState("elegivel");

  useEffect(() => {
    if (campanha) {
      setStatus(campanha.status);
      setTipoAcao(campanha.tipo_acao || "");
      setCanal(campanha.canal || "");
      setObservacoes(campanha.observacoes || "");
      setValorFechado(String(campanha.valor_fechado || ""));
      setReceitaIncremental(String(campanha.receita_incremental || ""));
      setResponsavelFechamento(campanha.responsavel_fechamento || "");

      if (campanha.client) {
        setMrrAtual(String(campanha.client.mrr_atual || ""));
        setLtvAtual(String(campanha.client.ltv_atual || ""));
        setLtvProjetado(String(campanha.client.ltv_projetado || ""));
        setPotencialExpansao(campanha.client.potencial_expansao || "medio");
        setTipoClienteTempo(campanha.client.tipo_cliente_tempo || "onboarding");
      }
    }
  }, [campanha]);

  const handleSave = async () => {
    if (!campanha) return;

    try {
      // Update campanha
      await updateCampanha.mutateAsync({
        id: campanha.id,
        status: status as any,
        tipo_acao: tipoAcao as any,
        canal: canal as any,
        observacoes: observacoes || null,
        valor_fechado: parseFloat(valorFechado) || 0,
        receita_incremental: parseFloat(receitaIncremental) || 0,
        responsavel_fechamento: responsavelFechamento || null,
        data_abordagem: status !== "planejado" && !campanha.data_abordagem 
          ? new Date().toISOString() 
          : campanha.data_abordagem,
      });

      // Update client if exists
      if (campanha.client) {
        await updateClient.mutateAsync({
          id: campanha.client.id,
          mrr_atual: parseFloat(mrrAtual) || 0,
          ltv_atual: parseFloat(ltvAtual) || 0,
          ltv_projetado: parseFloat(ltvProjetado) || 0,
          potencial_expansao: potencialExpansao as any,
          tipo_cliente_tempo: tipoClienteTempo as any,
        });
      }

      toast.success("Salvo com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar");
    }
  };

  const handleDelete = async () => {
    if (!campanha) return;
    if (!confirm("Tem certeza que deseja excluir esta campanha de upsell?")) return;

    try {
      await deleteCampanha.mutateAsync(campanha.id);
      toast.success("Excluído com sucesso!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const handleAddProduct = async () => {
    if (!campanha?.client?.id || !newProductId) return;

    try {
      await createProduto.mutateAsync({
        upsell_client_id: campanha.client.id,
        product_id: newProductId,
        status: newProductStatus as any,
      });
      setNewProductId("");
      toast.success("Produto adicionado!");
    } catch (error) {
      toast.error("Erro ao adicionar produto");
    }
  };

  if (!campanha) return null;

  const client = campanha.client;
  const statusColumn = upsellStatusColumns.find((s) => s.id === campanha.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {client?.nome_cliente || "Cliente"}
              </DialogTitle>
              {client?.setor && (
                <p className="text-sm text-muted-foreground mt-1">{client.setor}</p>
              )}
            </div>
            <Badge style={{ backgroundColor: statusColumn?.color }} className="text-white">
              {statusColumn?.title}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="campanha" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campanha">Campanha</TabsTrigger>
            <TabsTrigger value="cliente">Cliente</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
          </TabsList>

          {/* Campanha Tab */}
          <TabsContent value="campanha" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {upsellStatusColumns.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>Responsável pelo Fechamento</Label>
                <Select value={responsavelFechamento} onValueChange={setResponsavelFechamento}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Fechado (R$)</Label>
                <Input
                  type="number"
                  value={valorFechado}
                  onChange={(e) => setValorFechado(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Receita Incremental (R$)</Label>
                <Input
                  type="number"
                  value={receitaIncremental}
                  onChange={(e) => setReceitaIncremental(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações Estratégicas</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Notas sobre a abordagem, histórico..."
                rows={4}
              />
            </div>

            {campanha.data_abordagem && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Abordado em: {format(new Date(campanha.data_abordagem), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </div>
            )}
          </TabsContent>

          {/* Cliente Tab */}
          <TabsContent value="cliente" className="space-y-4 mt-4">
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
                <Label>Potencial de Expansão</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  MRR Atual (R$)
                </Label>
                <Input
                  type="number"
                  value={mrrAtual}
                  onChange={(e) => setMrrAtual(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  LTV Atual (R$)
                </Label>
                <Input
                  type="number"
                  value={ltvAtual}
                  onChange={(e) => setLtvAtual(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>LTV Projetado (R$)</Label>
                <Input
                  type="number"
                  value={ltvProjetado}
                  onChange={(e) => setLtvProjetado(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {client && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>CNPJ:</strong> {client.cnpj || "Não informado"}</p>
                <p><strong>Tempo de contrato:</strong> {client.tempo_contrato_meses || 0} meses</p>
                {client.data_primeira_venda && (
                  <p><strong>Primeira venda:</strong> {format(new Date(client.data_primeira_venda), "dd/MM/yyyy", { locale: ptBR })}</p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Produtos Tab */}
          <TabsContent value="produtos" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Select value={newProductId} onValueChange={setNewProductId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.is_active).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newProductStatus} onValueChange={setNewProductStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="elegivel">Elegível</SelectItem>
                  <SelectItem value="ofertado_passado">Já Ofertado</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddProduct} disabled={!newProductId}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {clientProdutos.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{prod.product?.name}</p>
                    <p className="text-xs text-muted-foreground">{prod.product?.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={prod.status}
                      onValueChange={(value) => updateProduto.mutate({ id: prod.id, status: value as any })}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="elegivel">Elegível</SelectItem>
                        <SelectItem value="ofertado_passado">Já Ofertado</SelectItem>
                        <SelectItem value="bloqueado">Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteProduto.mutate(prod.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {clientProdutos.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum produto mapeado para este cliente.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
