import { motion } from "framer-motion";
import { TrendingUp, Target, Flame, Zap } from "lucide-react";

interface SalesThermometerProps {
  meta: number;
  atual: number;
  ondeDeveria: number;
  quantoFalta: number;
}

export function SalesThermometer({ meta, atual, ondeDeveria, quantoFalta }: SalesThermometerProps) {
  const percentage = Math.min((atual / meta) * 100, 100);
  const expectedPercentage = Math.min((ondeDeveria / meta) * 100, 100);
  const isAhead = atual >= ondeDeveria;
  const isCompleted = atual >= meta;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  // Temperature color based on progress
  const getTemperatureColor = () => {
    if (isCompleted) return "from-emerald-400 via-emerald-500 to-emerald-600";
    if (percentage >= 80) return "from-orange-400 via-orange-500 to-red-500";
    if (percentage >= 60) return "from-amber-400 via-orange-400 to-orange-500";
    if (percentage >= 40) return "from-yellow-400 via-amber-400 to-orange-400";
    return "from-blue-400 via-blue-500 to-blue-600";
  };

  const getGlowColor = () => {
    if (isCompleted) return "shadow-emerald-500/50";
    if (percentage >= 80) return "shadow-orange-500/50";
    if (percentage >= 60) return "shadow-amber-500/50";
    return "shadow-blue-500/50";
  };

  return (
    <div className="relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-card/80 to-card border border-border/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${getTemperatureColor()} shadow-lg ${getGlowColor()}`}>
          <Target className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Meta do Mês</h2>
          <p className="text-muted-foreground text-sm">Faturamento Geral</p>
        </div>
      </div>

      {/* Thermometer Container */}
      <div className="relative flex items-end gap-8 h-[400px]">
        {/* Thermometer */}
        <div className="relative w-24 h-full">
          {/* Bulb at bottom */}
          <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-gradient-to-br ${getTemperatureColor()} shadow-2xl ${getGlowColor()} flex items-center justify-center z-10`}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-center"
            >
              <span className="text-3xl font-black text-white">{percentage.toFixed(0)}%</span>
            </motion.div>
          </div>

          {/* Tube */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-16 h-[320px] bg-card rounded-t-full border-4 border-border overflow-hidden">
            {/* Scale marks */}
            {[0, 25, 50, 75, 100].map((mark) => (
              <div
                key={mark}
                className="absolute w-full flex items-center justify-end pr-1"
                style={{ bottom: `${mark}%` }}
              >
                <div className="w-3 h-0.5 bg-muted-foreground/40" />
              </div>
            ))}

            {/* Expected position marker */}
            <motion.div
              initial={{ bottom: 0 }}
              animate={{ bottom: `${expectedPercentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute left-full ml-1 flex items-center z-20"
            >
              <div className="w-3 h-1 bg-warning" />
              <span className="text-xs font-semibold text-warning whitespace-nowrap ml-1">
                Deveria
              </span>
            </motion.div>

            {/* Fill */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${percentage}%` }}
              transition={{ duration: 2, ease: "easeOut" }}
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getTemperatureColor()} rounded-t-full`}
            >
              {/* Bubbles animation */}
              {percentage > 20 && (
                <div className="absolute inset-0 overflow-hidden rounded-t-full">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white/30 rounded-full"
                      initial={{ bottom: 0, left: `${20 + i * 15}%` }}
                      animate={{ 
                        bottom: ["0%", "100%"],
                        opacity: [0.3, 0]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2 + i * 0.5,
                        delay: i * 0.3,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Heat waves when doing well */}
          {percentage >= 70 && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <motion.div
                animate={{ y: [-5, -15], opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Flame className="w-6 h-6 text-orange-500" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Stats Panel */}
        <div className="flex flex-col gap-4 min-w-[200px]">
          {/* Current Value */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30"
          >
            <p className="text-sm text-muted-foreground mb-1">Vendas Atuais</p>
            <p className="text-3xl font-black text-primary">{formatCurrency(atual)}</p>
          </motion.div>

          {/* Where should be */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className={`p-4 rounded-xl border ${
              isAhead 
                ? "bg-success/10 border-success/30" 
                : "bg-warning/10 border-warning/30"
            }`}
          >
            <p className="text-sm text-muted-foreground mb-1">Deveria Estar</p>
            <p className={`text-2xl font-bold ${isAhead ? "text-success" : "text-warning"}`}>
              {formatCurrency(ondeDeveria)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {isAhead ? (
                <>
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-xs text-success">Acima do esperado!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-warning" />
                  <span className="text-xs text-warning">Acelerar vendas!</span>
                </>
              )}
            </div>
          </motion.div>

          {/* What's left */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="p-4 rounded-xl bg-gradient-to-r from-destructive/20 to-destructive/10 border border-destructive/30"
          >
            <p className="text-sm text-muted-foreground mb-1">Falta para Meta</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(quantoFalta)}</p>
          </motion.div>

          {/* Goal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 }}
            className="p-4 rounded-xl bg-muted/50 border border-border"
          >
            <p className="text-sm text-muted-foreground mb-1">Meta Total</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(meta)}</p>
          </motion.div>
        </div>
      </div>

      {/* Completion celebration */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-sm"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <span className="text-8xl">🏆</span>
            </motion.div>
            <p className="text-3xl font-black text-success mt-4">META BATIDA!</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
