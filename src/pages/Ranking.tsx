import { motion } from "framer-motion";
import { Trophy, Medal, Award, TrendingUp, Zap, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import badgeIcon from "@/assets/badge-icon.png";

interface RankingUser {
  id: string;
  name: string;
  role: "Closer" | "SDR";
  avatar?: string;
  value: number;
  conversions?: number;
  meetings?: number;
  goalProgress: number;
  position: number;
}

const mockClosers: RankingUser[] = [
  { id: "1", name: "Maria Santos", role: "Closer", value: 85000, conversions: 14, goalProgress: 106, position: 1 },
  { id: "2", name: "João Silva", role: "Closer", value: 72000, conversions: 11, goalProgress: 90, position: 2 },
  { id: "3", name: "Ana Costa", role: "Closer", value: 68000, conversions: 9, goalProgress: 85, position: 3 },
  { id: "4", name: "Pedro Lima", role: "Closer", value: 45000, conversions: 6, goalProgress: 56, position: 4 },
  { id: "5", name: "Carla Souza", role: "Closer", value: 38000, conversions: 5, goalProgress: 48, position: 5 },
];

const mockSDRs: RankingUser[] = [
  { id: "1", name: "Lucas Mendes", role: "SDR", value: 0, meetings: 45, goalProgress: 112, position: 1 },
  { id: "2", name: "Julia Ferreira", role: "SDR", value: 0, meetings: 41, goalProgress: 102, position: 2 },
  { id: "3", name: "Rafael Costa", role: "SDR", value: 0, meetings: 38, goalProgress: 95, position: 3 },
];

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
                {user.conversions} vendas
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold">{user.meetings}</p>
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-accent to-accent/80 rounded-2xl p-8 text-accent-foreground"
      >
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium opacity-80">Líder do Mês</h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <Zap className="w-6 h-6 text-primary" />
            <span className="text-3xl font-bold">Maria Santos</span>
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <p className="text-4xl font-bold text-primary mt-2">
            R$ 85.000
          </p>
          <p className="opacity-60 mt-1">106% da meta atingida</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {mockClosers.slice(0, 3).map((user) => (
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
              <p className="text-sm opacity-60">{user.conversions} vendas</p>
            </div>
          ))}
        </div>
      </motion.div>

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
          {mockClosers.map((user) => (
            <RankingCard key={user.id} user={user} />
          ))}
        </TabsContent>

        <TabsContent value="sdrs" className="space-y-3">
          {mockSDRs.map((user) => (
            <RankingCard key={user.id} user={user} showValue={false} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
