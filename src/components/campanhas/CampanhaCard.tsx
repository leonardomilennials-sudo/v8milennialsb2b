import { format, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Campanha } from "@/hooks/useCampanhas";
import { Calendar, Target, Users, ArrowRight, Trophy, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCampanhaLeads, useCampanhaStages, useCampanhaMembers } from "@/hooks/useCampanhas";

interface CampanhaCardProps {
  campanha: Campanha;
}

export function CampanhaCard({ campanha }: CampanhaCardProps) {
  const navigate = useNavigate();
  const { data: leads } = useCampanhaLeads(campanha.id);
  const { data: stages } = useCampanhaStages(campanha.id);
  const { data: members } = useCampanhaMembers(campanha.id);

  const deadline = new Date(campanha.deadline);
  const daysRemaining = differenceInDays(deadline, new Date());
  const isExpired = isPast(deadline);

  // Count leads in "reuniao_marcada" stage
  const reuniaoMarcadaStage = stages?.find((s) => s.is_reuniao_marcada);
  const meetingsCount = leads?.filter((l) => l.stage_id === reuniaoMarcadaStage?.id).length || 0;
  const progress = campanha.team_goal > 0 ? (meetingsCount / campanha.team_goal) * 100 : 0;

  // Count members who earned bonus
  const bonusEarnedCount = members?.filter((m) => m.bonus_earned).length || 0;

  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {campanha.name}
            </CardTitle>
            {campanha.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {campanha.description}
              </p>
            )}
          </div>
          <Badge variant={isExpired ? "destructive" : campanha.is_active ? "default" : "secondary"}>
            {isExpired ? "Encerrada" : campanha.is_active ? "Ativa" : "Inativa"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-4 h-4" />
              Progresso do Time
            </span>
            <span className="font-semibold">
              {meetingsCount} / {campanha.team_goal}
            </span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Calendar className="w-3 h-3" />
              Prazo
            </div>
            <p className="font-semibold text-sm">
              {isExpired ? (
                <span className="text-destructive">Encerrada</span>
              ) : (
                <span className={daysRemaining <= 3 ? "text-warning" : ""}>
                  {daysRemaining}d
                </span>
              )}
            </p>
          </div>

          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Users className="w-3 h-3" />
              Vendedores
            </div>
            <p className="font-semibold text-sm">{members?.length || 0}</p>
          </div>

          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Trophy className="w-3 h-3" />
              Bônus
            </div>
            <p className="font-semibold text-sm text-primary">{bonusEarnedCount}</p>
          </div>
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              Até {format(deadline, "dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate(`/campanhas/${campanha.id}`)}
          >
            Abrir
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
