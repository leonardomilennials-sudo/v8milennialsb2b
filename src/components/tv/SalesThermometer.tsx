import { motion } from "framer-motion";
import { Target } from "lucide-react";

interface SalesThermometerProps {
  meta: number;
  atual: number;
  ondeDeveria: number;
}

export function SalesThermometer({ meta, atual, ondeDeveria }: SalesThermometerProps) {
  const percentage = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
  const expectedPercentage = meta > 0 ? Math.min((ondeDeveria / meta) * 100, 100) : 0;
  const isAhead = atual >= ondeDeveria;
  const isCompleted = atual >= meta;
  const quantoFalta = Math.max(0, meta - atual);
  const diferenca = Math.abs(atual - ondeDeveria);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  // Divide thermometer into 5 parts (0%, 25%, 50%, 75%, 100%)
  const divisions = [0, 25, 50, 75, 100];
  const divisionValues = divisions.map(d => (meta * d) / 100);

  return (
    <div className="h-full flex flex-col">
      {/* Header - Meta + Falta */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">Meta do Mês</span>
        </div>
        <h2 className="text-3xl font-black text-foreground font-racing tracking-tight">
          {formatCurrency(meta)}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Falta: <span className="font-bold text-foreground">{formatCurrency(quantoFalta)}</span>
        </p>
      </div>

      {/* Thermometer Container */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative flex items-end gap-3 h-full max-h-[280px]">
          {/* Division labels on left */}
          <div className="relative h-full flex flex-col justify-between py-4 text-right">
            {[...divisions].reverse().map((mark, i) => (
              <div key={mark} className="flex items-center gap-1">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {formatCurrency(divisionValues[4 - i])}
                </span>
              </div>
            ))}
          </div>

          {/* Thermometer Tube */}
          <div className="relative h-full w-12 flex flex-col items-center">
            <div className="relative flex-1 w-full rounded-t-full overflow-hidden bg-accent/10 border-2 border-accent/20 backdrop-blur-sm">
              {/* Division lines */}
              {divisions.slice(1, -1).map((mark) => (
                <div
                  key={mark}
                  className="absolute left-0 right-0 h-px bg-accent/30"
                  style={{ bottom: `${mark}%` }}
                />
              ))}

              {/* Fill */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`absolute bottom-0 left-0 right-0 rounded-t-full ${
                  isCompleted 
                    ? "bg-gradient-to-t from-emerald-500 to-emerald-400" 
                    : isAhead
                      ? "bg-gradient-to-t from-emerald-500 to-emerald-400"
                      : "bg-gradient-to-t from-amber-500 to-amber-400"
                }`}
              >
                {/* Shine effect */}
                <div className="absolute inset-y-0 left-1 w-1.5 bg-white/20 rounded-full" />
              </motion.div>

              {/* Current position marker */}
              <motion.div
                initial={{ bottom: 0 }}
                animate={{ bottom: `${percentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute left-full ml-2 flex items-center z-20"
                style={{ transform: "translateY(50%)" }}
              >
                <div className={`h-0.5 w-3 ${isAhead ? "bg-emerald-500" : "bg-amber-500"}`} />
                <div className={`px-2 py-1 rounded-lg text-white text-xs font-bold whitespace-nowrap shadow-lg ${
                  isAhead ? "bg-emerald-500" : "bg-amber-500"
                }`}>
                  {formatCurrency(atual)}
                  <span className="ml-1 opacity-80">({percentage.toFixed(0)}%)</span>
                </div>
              </motion.div>
            </div>

            {/* Bulb */}
            <div 
              className={`w-14 h-14 rounded-full -mt-2 z-10 shadow-xl flex items-center justify-center ${
                isCompleted 
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600" 
                  : isAhead
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                    : "bg-gradient-to-br from-amber-400 to-amber-600"
              }`}
            >
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-lg font-black text-white"
              >
                {percentage.toFixed(0)}%
              </motion.span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`mt-4 p-3 rounded-xl border backdrop-blur-sm text-center ${
          isAhead 
            ? "bg-emerald-500/10 border-emerald-500/30" 
            : "bg-amber-500/10 border-amber-500/30"
        }`}
      >
        <p className={`text-sm font-bold ${isAhead ? "text-emerald-400" : "text-amber-400"}`}>
          {isAhead ? "✨ Acima do esperado!" : "⚡ Acelerar vendas!"}
        </p>
        <p className={`text-lg font-black ${isAhead ? "text-emerald-400" : "text-amber-400"}`}>
          {formatCurrency(diferenca)} {isAhead ? "à frente" : "atrás"}
        </p>
      </motion.div>

      {/* Completion celebration */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm z-50"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <span className="text-6xl">🏆</span>
            </motion.div>
            <p className="text-2xl font-black text-emerald-400 mt-2 font-racing">META BATIDA!</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
