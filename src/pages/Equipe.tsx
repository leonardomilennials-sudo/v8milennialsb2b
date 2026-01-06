import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  DollarSign,
  Percent,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MoreHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTeamMembers, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember, TeamMember } from "@/hooks/useTeamMembers";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useProfiles } from "@/hooks/useProfiles";
import { toast } from "sonner";

type TeamRole = "sdr" | "closer";

interface TeamMemberFormData {
  name: string;
  role: TeamRole;
  ote_base: number;
  ote_bonus: number;
  commission_mrr_percent: number;
  commission_projeto_percent: number;
  is_active: boolean;
  user_id: string | null;
}

const initialFormData: TeamMemberFormData = {
  name: "",
  role: "sdr",
  ote_base: 0,
  ote_bonus: 0,
  commission_mrr_percent: 1.0,
  commission_projeto_percent: 0.5,
  is_active: true,
  user_id: null,
};

export default function Equipe() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<TeamMemberFormData>(initialFormData);

  const { data: members = [], isLoading } = useTeamMembers();
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const { isAdmin } = useIsAdmin();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const { data: profiles = [] } = useProfiles();

  const handleOpenDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        role: member.role as TeamRole,
        ote_base: Number(member.ote_base) || 0,
        ote_bonus: Number(member.ote_bonus) || 0,
        commission_mrr_percent: Number(member.commission_mrr_percent) || 1.0,
        commission_projeto_percent: Number(member.commission_projeto_percent) || 0.5,
        is_active: member.is_active,
        user_id: member.user_id || null,
      });
    } else {
      setEditingMember(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingMember) {
        await updateMember.mutateAsync({
          id: editingMember.id,
          ...formData,
        });
        toast.success("Membro atualizado com sucesso!");
      } else {
        await createMember.mutateAsync(formData);
        toast.success("Membro adicionado com sucesso!");
      }
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingMember(null);
    } catch (error) {
      toast.error("Erro ao salvar membro");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      toast.success("Membro removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover membro");
      console.error(error);
    }
  };

  const roleLabels = {
    sdr: "SDR",
    closer: "Closer",
  };

  const roleColors = {
    sdr: "bg-chart-5/10 text-chart-5 border-chart-5/20",
    closer: "bg-primary/10 text-primary border-primary/20",
  };

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
            <Users className="w-6 h-6 text-primary" />
            Equipe
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Gerencie SDRs, Closers e suas configurações de OTE
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? "Editar Membro" : "Adicionar Membro"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do membro da equipe
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Função</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: TeamRole) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sdr">SDR</SelectItem>
                      <SelectItem value="closer">Closer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ote_base">OTE Base (R$)</Label>
                    <Input
                      id="ote_base"
                      type="number"
                      value={formData.ote_base}
                      onChange={(e) => setFormData({ ...formData, ote_base: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ote_bonus">OTE Bônus (R$)</Label>
                    <Input
                      id="ote_bonus"
                      type="number"
                      value={formData.ote_bonus}
                      onChange={(e) => setFormData({ ...formData, ote_bonus: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="commission_mrr">Comissão MRR (%)</Label>
                    <Input
                      id="commission_mrr"
                      type="number"
                      step="0.1"
                      value={formData.commission_mrr_percent}
                      onChange={(e) => setFormData({ ...formData, commission_mrr_percent: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="commission_projeto">Comissão Projeto (%)</Label>
                    <Input
                      id="commission_projeto"
                      type="number"
                      step="0.1"
                      value={formData.commission_projeto_percent}
                      onChange={(e) => setFormData({ ...formData, commission_projeto_percent: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user_id">Vincular ao Usuário</Label>
                  <Select
                    value={formData.user_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, user_id: value === "none" ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Vincule a um usuário cadastrado para ele acessar suas comissões
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Membro Ativo</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={createMember.isPending || updateMember.isPending}>
                  {editingMember ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">Total Membros</p>
          <p className="text-xl font-bold">{members.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">SDRs Ativos</p>
          <p className="text-xl font-bold text-chart-5">
            {members.filter((m) => m.role === "sdr" && m.is_active).length}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">Closers Ativos</p>
          <p className="text-xl font-bold text-primary">
            {members.filter((m) => m.role === "closer" && m.is_active).length}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">Folha OTE Total</p>
          <p className="text-xl font-bold text-success">
            {formatCurrency(
              members
                .filter((m) => m.is_active)
                .reduce((sum, m) => sum + Number(m.ote_base || 0) + Number(m.ote_bonus || 0), 0)
            )}
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar membro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Funções</SelectItem>
            <SelectItem value="sdr">SDR</SelectItem>
            <SelectItem value="closer">Closer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">OTE Base</TableHead>
              <TableHead className="text-right">OTE Bônus</TableHead>
              <TableHead className="text-right">Comissão MRR</TableHead>
              <TableHead className="text-right">Comissão Projeto</TableHead>
              {isAdmin && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum membro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColors[member.role as TeamRole]}>
                      {roleLabels[member.role as TeamRole]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.is_active ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        <UserX className="w-3 h-3 mr-1" />
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(member.ote_base) || 0)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(member.ote_bonus) || 0)}</TableCell>
                  <TableCell className="text-right">{Number(member.commission_mrr_percent || 0)}%</TableCell>
                  <TableCell className="text-right">{Number(member.commission_projeto_percent || 0)}%</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(member)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
