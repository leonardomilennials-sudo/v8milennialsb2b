import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Campanha, CampanhaStage, CampanhaLead, CampanhaMember } from "@/hooks/useCampanhas";
import { format, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Target, Users, Trophy, Calendar, TrendingUp, DollarSign, Award } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface CampanhaAnalyticsProps {
  campanha: Campanha;
  stages: CampanhaStage[];
  leads: CampanhaLead[];
  members: CampanhaMember[];
}

export function CampanhaAnalytics({
  campanha,
  stages,
  leads,
  members,
}: CampanhaAnalyticsProps) {
  const deadline = new Date(campanha.deadline);
  const daysRemaining = differenceInDays(deadline, new Date());
  const isExpired = isPast(deadline);

  // Find the "reuniao_marcada" stage
  const reuniaoStage = stages.find((s) => s.is_reuniao_marcada);
  const meetingsCount = leads.filter((l) => l.stage_id === reuniaoStage?.id).length;
  const teamProgress = campanha.team_goal > 0 ? (meetingsCount / campanha.team_goal) * 100 : 0;

  // Count leads per stage for pie chart
  const stageData = stages.map((stage) => ({
    name: stage.name,
    value: leads.filter((l) => l.stage_id === stage.id).length,
    color: stage.color || "#3B82F6",
  }));

  // Count meetings per member for bar chart
  const memberData = members.map((member) => {
    const memberMeetings = leads.filter(
      (l) => l.sdr_id === member.team_member_id && l.stage_id === reuniaoStage?.id
    ).length;

    return {
      name: member.team_member?.name || "Desconhecido",
      reunioes: memberMeetings,
      meta: campanha.individual_goal || 0,
      atingiu: memberMeetings >= (campanha.individual_goal || 0),
    };
  });

  // Calculate total bonus to be paid
  const bonusEarnedCount = members.filter((m) => {
    const memberMeetings = leads.filter(
      (l) => l.sdr_id === m.team_member_id && l.stage_id === reuniaoStage?.id
    ).length;
    return memberMeetings >= (campanha.individual_goal || 0);
  }).length;

  const totalBonusToPay = bonusEarnedCount * (campanha.bonus_value || 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progresso</p>
                <p className="text-2xl font-bold">{meetingsCount}/{campanha.team_goal}</p>
              </div>
              <Target className="w-8 h-8 text-primary opacity-50" />
            </div>
            <Progress value={Math.min(teamProgress, 100)} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prazo</p>
                <p className="text-2xl font-bold">
                  {isExpired ? (
                    <span className="text-destructive">Encerrada</span>
                  ) : (
                    <span className={daysRemaining <= 3 ? "text-warning" : ""}>
                      {daysRemaining}d
                    </span>
                  )}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-primary opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {format(deadline, "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bônus Atingidos</p>
                <p className="text-2xl font-bold text-primary">{bonusEarnedCount}</p>
              </div>
              <Trophy className="w-8 h-8 text-primary opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              de {members.length} vendedores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bônus</p>
                <p className="text-2xl font-bold text-emerald-500">
                  R$ {totalBonusToPay.toLocaleString("pt-BR")}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              R$ {campanha.bonus_value?.toLocaleString("pt-BR")} por meta
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Member */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Performance Individual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {memberData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={memberData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="reunioes"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="meta"
                    fill="hsl(var(--muted))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum vendedor na campanha
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads by Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Distribuição por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stageData.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stageData.filter((s) => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {stageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum lead na campanha
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Individual Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4" />
            Ranking Individual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {memberData
              .sort((a, b) => b.reunioes - a.reunioes)
              .map((member, index) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-yellow-900"
                          : index === 1
                          ? "bg-gray-300 text-gray-700"
                          : index === 2
                          ? "bg-orange-400 text-orange-900"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.reunioes} reuniões
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress
                      value={campanha.individual_goal ? (member.reunioes / campanha.individual_goal) * 100 : 0}
                      className="w-24 h-2"
                    />
                    {member.atingiu && (
                      <Badge className="bg-emerald-500 text-white">
                        <Trophy className="w-3 h-3 mr-1" />
                        Bônus
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
