import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, TrendingUp, DollarSign, Building2, Upload, LayoutGrid, List } from "lucide-react";
import { useUpsellClients, UpsellClient, tipoClienteTempoLabels } from "@/hooks/useUpsell";
import { CreateClienteModal } from "./CreateClienteModal";
import { ClienteDetailModal } from "./ClienteDetailModal";
import { ClientesKanban } from "./ClientesKanban";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Eye } from "lucide-react";

export function ClientesList() {
  const { data: clients = [], isLoading } = useUpsellClients();
  const [search, setSearch] = useState("");
  const [tipoTempoFilter, setTipoTempoFilter] = useState("all");
  const [potencialFilter, setPotencialFilter] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UpsellClient | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.nome_cliente.toLowerCase().includes(search.toLowerCase()) ||
      c.setor?.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj?.includes(search);
    const matchesTipo = tipoTempoFilter === "all" || c.tipo_cliente_tempo === tipoTempoFilter;
    const matchesPotencial = potencialFilter === "all" || c.potencial_expansao === potencialFilter;
    return matchesSearch && matchesTipo && matchesPotencial;
  });

  // Stats
  const totalClients = clients.length;
  const totalMRR = clients.reduce((acc, c) => acc + (c.mrr_atual || 0), 0);
  const totalLTV = clients.reduce((acc, c) => acc + (c.ltv_atual || 0), 0);
  const highPotentialClients = clients.filter((c) => c.potencial_expansao === "alto").length;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const getPotencialColor = (potencial: string) => {
    switch (potencial) {
      case "alto":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medio":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "baixo":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTipoTempoColor = (tipo: string) => {
    switch (tipo) {
      case "onboarding":
        return "bg-blue-500/20 text-blue-400";
      case "recentes":
        return "bg-cyan-500/20 text-cyan-400";
      case "iniciantes":
        return "bg-teal-500/20 text-teal-400";
      case "momento_chave":
        return "bg-orange-500/20 text-orange-400";
      case "fieis":
        return "bg-green-500/20 text-green-400";
      case "mavericks":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleCardClick = (client: UpsellClient) => {
    setSelectedClient(client);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-bold">{totalClients}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MRR Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalMRR)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">LTV Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalLTV)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-orange-500/10">
              <Building2 className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alto Potencial</p>
              <p className="text-2xl font-bold">{highPotentialClients}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar Clientes
          </Button>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        {viewMode === "list" && (
          <>
            <Select value={tipoTempoFilter} onValueChange={setTipoTempoFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo por Tempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(tipoClienteTempoLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={potencialFilter} onValueChange={setPotencialFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Potencial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : viewMode === "kanban" ? (
        <ClientesKanban 
          clients={search ? filteredClients : clients} 
          onCardClick={handleCardClick} 
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            {filteredClients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum cliente encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Estágio</TableHead>
                    <TableHead className="text-right">MRR</TableHead>
                    <TableHead className="text-right">LTV</TableHead>
                    <TableHead>Potencial</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div>
                          <p>{client.nome_cliente}</p>
                          {client.cnpj && (
                            <p className="text-xs text-muted-foreground">{client.cnpj}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{client.setor || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getTipoTempoColor(client.tipo_cliente_tempo)}>
                          {tipoClienteTempoLabels[client.tipo_cliente_tempo]?.split(" ")[0] || client.tipo_cliente_tempo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(client.mrr_atual || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(client.ltv_atual || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPotencialColor(client.potencial_expansao || "medio")}>
                          {client.potencial_expansao?.toUpperCase() || "MÉDIO"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.responsavel?.name || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCardClick(client)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCardClick(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateClienteModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      <ClienteDetailModal
        client={selectedClient}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}
