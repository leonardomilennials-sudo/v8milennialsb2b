import { motion } from "framer-motion";
import { Target, Flame, Zap } from "lucide-react";

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
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  // Divide thermometer into 5 parts
  const divisions = [0, 15, 30, 45, 60];

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 mb-2">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Meta do Mês</span>
        </div>
        
        <h2 className="text-3xl font-black text-sidebar-foreground font-racing">
          {formatCurrency(meta)}
        </h2>
        
        <p className="text-xs text-sidebar-foreground/60 mt-1">
          Falta <span className="font-bold text-amber-400">{formatCurrency(quantoFalta)}</span>
        </p>
      </div>

      {/* Thermometer */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative flex items-end h-full max-h-[240px]">
          {/* Left scale */}
          <div className="flex flex-col justify-between h-full pr-2 pb-8">
            {[...divisions].reverse().map((val) => (
              <span key={val} className="text-[9px] font-mono text-sidebar-foreground/50 text-right">
                {val}K
              </span>
            ))}
          </div>

          {/* Thermometer tube */}
          <div className="relative flex flex-col items-center">
            <div className="relative w-10 flex-1 min-h-[160px] rounded-t-full bg-slate-800/80 border border-slate-700 overflow-hidden">
              {/* Division lines */}
              {[25, 50, 75].map((p) => (
                <div key={p} className="absolute left-0 right-0 h-px bg-slate-600" style={{ bottom: `${p}%` }} />
              ))}

              {/* Expected marker */}
              <div 
                className="absolute left-0 right-0 h-0.5 bg-white/30 z-10"
                style={{ bottom: `${expectedPercentage}%` }}
              />

              {/* Fill */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`absolute bottom-0 left-0.5 right-0.5 rounded-t-full ${
                  isAhead 
                    ? "bg-gradient-to-t from-emerald-600 to-emerald-400" 
                    : "bg-gradient-to-t from-amber-600 to-yellow-400"
                }`}
              >
                <div className="absolute inset-y-0 left-0.5 w-1 bg-white/20 rounded-full" />
              </motion.div>
            </div>

            {/* Bulb */}
            <motion.div 
              animate={{ 
                boxShadow: isAhead 
                  ? ["0 0 10px rgba(16,185,129,0.4)", "0 0 20px rgba(16,185,129,0.6)", "0 0 10px rgba(16,185,129,0.4)"]
                  : ["0 0 10px rgba(245,158,11,0.4)", "0 0 20px rgba(245,158,11,0.6)", "0 0 10px rgba(245,158,11,0.4)"]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`w-12 h-12 rounded-full -mt-1 flex items-center justify-center z-10 ${
                isAhead 
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600" 
                  : "bg-gradient-to-br from-amber-400 to-amber-600"
              }`}
            >
              <span className="text-base font-black text-white">{percentage.toFixed(0)}%</span>
            </motion.div>
          </div>

          {/* Current value indicator */}
          <div className="relative h-full pb-8 pl-2">
            <motion.div
              initial={{ bottom: 0 }}
              animate={{ bottom: `${percentage}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute left-2"
              style={{ transform: "translateY(50%)" }}
            >
              <div className="flex items-center gap-1">
                <div className={`w-0 h-0 border-t-[6px] border-b-[6px] border-r-[8px] border-transparent ${
                  isAhead ? "border-r-emerald-500" : "border-r-amber-500"
                }`} />
                <div className={`px-2 py-1 rounded-md text-white font-bold text-xs whitespace-nowrap shadow-lg ${
                  isAhead ? "bg-emerald-500" : "bg-amber-500"
                }`}>
                  {formatCurrency(atual)}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className={`mt-4 p-3 rounded-xl border ${
        isAhead 
          ? "bg-emerald-500/10 border-emerald-500/30" 
          : "bg-amber-500/10 border-amber-500/30"
      }`}>
        <div className="flex items-center justify-center gap-2">
          {isAhead ? (
            <Flame className="w-4 h-4 text-emerald-400" />
          ) : (
            <Zap className="w-4 h-4 text-amber-400" />
          )}
          <div className="text-center">
            <p className={`text-xs font-bold ${isAhead ? "text-emerald-400" : "text-amber-400"}`}>
              {isAhead ? "Acima do esperado!" : "Acelerar vendas!"}
            </p>
            <p className={`text-sm font-black ${isAhead ? "text-emerald-300" : "text-amber-300"}`}>
              {formatCurrency(diferenca)} {isAhead ? "à frente" : "atrás"}
            </p>
          </div>
        </div>
      </div>

      {/* Celebration */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl z-50"
        >
          <div className="text-center">
            <motion.span 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-6xl block"
            >
              🏆
            </motion.span>
            <p className="text-2xl font-black text-emerald-400 mt-2 font-racing">META BATIDA!</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}