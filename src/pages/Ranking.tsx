import { motion } from "framer-motion";
import { Trophy, Medal, Award, TrendingUp, Zap, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import badgeIcon from "@/assets/badge-icon.png";
import { useRankingData } from "@/hooks/useDashboardMetrics";

interface RankingUser {
  id: string;
  name: string;
  role: "Closer" | "SDR";
  value: number;
  conversions?: number;
  meetings?: number;
  goalProgress: number;
  position: number;
}

const positionStyles = {
  1: { icon: Trophy, color: "text-primary", bg: "bg-primary/10", border: "border-primary" },
  2: { icon: Medal, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
  3: { icon: Award, color: "text-warning", bg: "bg-warning/10", border: "border-warning/50" },
};

function RankingCard({ user, showValue = true }: { user: RankingUser; showValue?: boolean }) {
  const isTop3 = user.position <= 3;
  const styles = positionStyles[user.position as keyof typeof positionStyles];
  const Icon = styles?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: user.position * 0.05 }}
      className={`ranking-card ${
        user.position === 1 ? "ranking-card-winner" : ""
      } ${isTop3 ? styles.border : ""}`}
    >
      <div className="flex items-center gap-4">
        {/* Position */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isTop3 ? styles.bg : "bg-muted"
        }`}>
          {Icon ? (
            <Icon className={`w-6 h-6 ${styles.color}`} />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              {user.position}º
            </span>
          )}
        </div>

        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
          <span className="text-lg font-semibold text-accent-foreground">
            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{user.name}</h3>
            {user.goalProgress >= 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-0.5 bg-success/10 rounded-full"
              >
                <Star className="w-3 h-3 text-success fill-success" />
                <span className="text-xs font-medium text-success">Meta!</span>
              </motion.div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{user.role}</p>
        </div>

        {/* Stats */}
        <div className="text-right">
          {showValue ? (
            <>
              <p className="text-xl font-bold">R$ {user.value.toLocaleString("pt-BR")}</p>
              <p className="text-sm text-muted-foreground">
                {user.conversions || 0} vendas
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold">{user.meetings || 0}</p>
              <p className="text-sm text-muted-foreground">reuniões</p>
            </>
          )}
        </div>

        {/* Goal Progress */}
        <div className="w-24">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-semibold ${
              user.goalProgress >= 100 ? "text-success" : "text-muted-foreground"
            }`}>
              {user.goalProgress}%
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(user.goalProgress, 100)}%` }}
              transition={{ duration: 0.8, delay: user.position * 0.1 }}
              className={`progress-fill ${
                user.goalProgress >= 100 ? "bg-success" : "gradient-gold"
              }`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Ranking() {
  const now = new Date();
  const { data: rankingData, isLoading } = useRankingData(now.getMonth() + 1, now.getFullYear());

  const closers: RankingUser[] = rankingData?.closerRanking || [];
  const sdrs: RankingUser[] = rankingData?.sdrRanking || [];
  const leader = closers[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold flex items-center gap-3"
          >
            <Trophy className="w-7 h-7 text-primary" />
            Ranking de Vendas
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe a performance do time em tempo real
          </p>
        </div>
        <img src={badgeIcon} alt="" className="w-16 h-16 opacity-80" />
      </div>

      {/* Top 3 Highlight */}
      {isLoading ? (
        <Skeleton className="h-[300px] rounded-2xl" />
      ) : leader ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-accent to-accent/80 rounded-2xl p-8 text-accent-foreground"
        >
          <div className="text-center mb-8">
            <h2 className="text-lg font-medium opacity-80">Líder do Mês</h2>
            <div className="flex items-center justify-center gap-3 mt-2">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-3xl font-bold">{leader.name}</span>
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <p className="text-4xl font-bold text-primary mt-2">
              R$ {leader.value.toLocaleString("pt-BR")}
            </p>
            <p className="opacity-60 mt-1">{leader.goalProgress}% da meta atingida</p>
          </div>

          {closers.length > 0 && (
            <div className="grid grid-cols-3 gap-6">
              {closers.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className={`text-center p-4 rounded-xl ${
                    user.position === 1 ? "bg-primary/20" : "bg-white/5"
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold">
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-lg font-bold text-primary mt-1">
                    R$ {user.value.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-sm opacity-60">{user.conversions || 0} vendas</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <div className="bg-muted/50 rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Nenhum dado de ranking disponível.</p>
          <p className="text-sm text-muted-foreground mt-2">Cadastre closers e registre vendas.</p>
        </div>
      )}

      {/* Full Rankings */}
      <Tabs defaultValue="closers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="closers" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Closers
          </TabsTrigger>
          <TabsTrigger value="sdrs" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            SDRs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="closers" className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : closers.length > 0 ? (
            closers.map((user) => (
              <RankingCard key={user.id} user={user} />
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum closer cadastrado.</p>
          )}
        </TabsContent>

        <TabsContent value="sdrs" className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : sdrs.length > 0 ? (
            sdrs.map((user) => (
              <RankingCard key={user.id} user={user} showValue={false} />
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum SDR cadastrado.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
