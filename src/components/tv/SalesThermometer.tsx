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

  // Divide thermometer into 5 parts (0%, 25%, 50%, 75%, 100%)
  const divisions = [
    { percent: 0, value: 0 },
    { percent: 25, value: meta * 0.25 },
    { percent: 50, value: meta * 0.5 },
    { percent: 75, value: meta * 0.75 },
    { percent: 100, value: meta },
  ];

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-2">
          <Target className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Meta do Mês</span>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-4xl font-black text-foreground font-racing tracking-tight">
            {formatCurrency(meta)}
          </h2>
        </div>
        
        <p className="text-sm text-muted-foreground mt-1">
          Falta <span className="font-bold text-amber-400">{formatCurrency(quantoFalta)}</span>
        </p>
      </div>

      {/* Thermometer Container */}
      <div className="flex-1 flex justify-center items-center py-2">
        <div className="relative h-full flex items-stretch gap-0">
          
          {/* Left Labels */}
          <div className="relative flex flex-col justify-between pr-2 py-3" style={{ height: "100%" }}>
            {[...divisions].reverse().map((div, i) => (
              <div key={div.percent} className="flex items-center justify-end">
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                  {formatCurrency(div.value)}
                </span>
              </div>
            ))}
          </div>

          {/* Thermometer Body */}
          <div className="relative flex flex-col items-center" style={{ width: "60px" }}>
            {/* Tube */}
            <div className="relative flex-1 w-14 min-h-[180px] rounded-t-full overflow-visible bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 shadow-inner">
              
              {/* Division marks inside */}
              {divisions.slice(1, -1).map((div) => (
                <div
                  key={div.percent}
                  className="absolute left-0 right-0 h-[2px] bg-slate-600"
                  style={{ bottom: `${div.percent}%` }}
                />
              ))}

              {/* Expected position line */}
              <motion.div
                initial={{ bottom: 0 }}
                animate={{ bottom: `${expectedPercentage}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="absolute -left-1 -right-1 z-10 flex items-center"
                style={{ transform: "translateY(50%)" }}
              >
                <div className="flex-1 h-[2px] bg-white/40 border-t border-dashed border-white/60" />
              </motion.div>

              {/* Fill - Liquid */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`absolute bottom-0 left-1 right-1 rounded-t-full ${
                  isCompleted 
                    ? "bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400" 
                    : isAhead
                      ? "bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400"
                      : "bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400"
                }`}
              >
                {/* Shine effect */}
                <div className="absolute inset-y-0 left-1 w-2 bg-white/25 rounded-full blur-[1px]" />
                
                {/* Bubbles */}
                {percentage > 15 && [...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-white/30 rounded-full"
                    style={{ left: `${20 + i * 18}%` }}
                    initial={{ bottom: "10%", opacity: 0 }}
                    animate={{ 
                      bottom: ["10%", "90%"], 
                      opacity: [0.5, 0],
                      scale: [1, 0.5]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.5 + i * 0.4,
                      delay: i * 0.5,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </motion.div>

              {/* Current value indicator */}
              <motion.div
                initial={{ bottom: 0, opacity: 0 }}
                animate={{ bottom: `${percentage}%`, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute left-full ml-1 z-30"
                style={{ transform: "translateY(50%)" }}
              >
                <div className="flex items-center gap-0.5">
                  <div className={`w-0 h-0 border-t-4 border-b-4 border-r-8 border-transparent ${
                    isAhead ? "border-r-emerald-500" : "border-r-amber-500"
                  }`} />
                  <div className={`px-2 py-1 rounded-lg shadow-lg text-white font-bold text-xs whitespace-nowrap ${
                    isAhead 
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500" 
                      : "bg-gradient-to-r from-amber-600 to-amber-500"
                  }`}>
                    <span className="text-sm">{formatCurrency(atual)}</span>
                    <span className="ml-1 text-[10px] opacity-80">({percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bulb */}
            <div className="relative -mt-2 z-20">
              <motion.div 
                animate={{ 
                  boxShadow: isCompleted 
                    ? ["0 0 20px rgba(16, 185, 129, 0.5)", "0 0 40px rgba(16, 185, 129, 0.8)", "0 0 20px rgba(16, 185, 129, 0.5)"]
                    : isAhead
                      ? ["0 0 15px rgba(16, 185, 129, 0.4)", "0 0 25px rgba(16, 185, 129, 0.6)", "0 0 15px rgba(16, 185, 129, 0.4)"]
                      : ["0 0 15px rgba(245, 158, 11, 0.4)", "0 0 25px rgba(245, 158, 11, 0.6)", "0 0 15px rgba(245, 158, 11, 0.4)"]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-600" 
                    : isAhead
                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                      : "bg-gradient-to-br from-amber-400 to-amber-600"
                }`}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-center"
                >
                  <span className="text-xl font-black text-white drop-shadow-lg">
                    {percentage.toFixed(0)}%
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Right side - empty for balance */}
          <div className="w-20" />
        </div>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={`p-3 rounded-xl border-2 backdrop-blur-sm ${
          isAhead 
            ? "bg-emerald-500/10 border-emerald-500/40" 
            : "bg-amber-500/10 border-amber-500/40"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {isAhead ? (
            <Flame className="w-5 h-5 text-emerald-400" />
          ) : (
            <Zap className="w-5 h-5 text-amber-400" />
          )}
          <div className="text-center">
            <p className={`text-sm font-bold ${isAhead ? "text-emerald-400" : "text-amber-400"}`}>
              {isAhead ? "Acima do esperado!" : "Acelerar vendas!"}
            </p>
            <p className={`text-lg font-black ${isAhead ? "text-emerald-300" : "text-amber-300"}`}>
              {formatCurrency(diferenca)} {isAhead ? "à frente" : "atrás"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Completion celebration */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl backdrop-blur-sm z-50"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <span className="text-7xl">🏆</span>
            </motion.div>
            <motion.p 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-3xl font-black text-emerald-400 mt-3 font-racing tracking-wide"
            >
              META BATIDA!
            </motion.p>
          </div>
        </motion.div>
      )}
    </div>
  );
}