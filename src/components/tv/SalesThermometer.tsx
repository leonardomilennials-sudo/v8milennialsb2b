import { motion } from "framer-motion";
import { Target, TrendingUp, TrendingDown, Zap } from "lucide-react";

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

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  // Divide thermometer into 5 parts (0%, 25%, 50%, 75%, 100%)
  const divisions = [0, 25, 50, 75, 100];
  const divisionValues = divisions.map(d => (meta * d) / 100);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground font-racing">META DO MÊS</h2>
          <p className="text-2xl font-black text-primary">{formatCurrency(meta)}</p>
        </div>
      </div>

      {/* Thermometer Container */}
      <div className="flex-1 flex gap-6">
        {/* Thermometer */}
        <div className="relative flex flex-col items-center" style={{ width: "100px" }}>
          {/* Tube container */}
          <div className="relative flex-1 w-16 min-h-[200px]">
            {/* Tube background */}
            <div className="absolute inset-0 bg-accent/20 rounded-t-full rounded-b-3xl border-4 border-accent/30 overflow-hidden">
              {/* Division lines with values */}
              {divisions.map((mark, index) => (
                <div
                  key={mark}
                  className="absolute w-full flex items-center"
                  style={{ bottom: `${mark}%`, transform: "translateY(50%)" }}
                >
                  <div className="w-full h-0.5 bg-accent/40" />
                  {/* Value label on the right */}
                  <div className="absolute left-full ml-2 whitespace-nowrap">
                    <span className="text-xs font-bold text-foreground">
                      {formatCurrency(divisionValues[index])}
                    </span>
                  </div>
                </div>
              ))}

              {/* Expected position marker */}
              <motion.div
                initial={{ bottom: 0 }}
                animate={{ bottom: `${expectedPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute right-full mr-2 flex items-center z-20"
                style={{ transform: "translateY(50%)" }}
              >
                <span className="text-xs font-semibold text-warning whitespace-nowrap bg-warning/20 px-2 py-0.5 rounded">
                  Deveria: {formatCurrency(ondeDeveria)}
                </span>
                <div className="w-2 h-0.5 bg-warning" />
              </motion.div>

              {/* Fill */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute bottom-0 left-0 right-0 rounded-t-full"
                style={{
                  background: isCompleted 
                    ? "linear-gradient(to top, hsl(142 70% 45%), hsl(152 70% 50%))"
                    : "linear-gradient(to top, hsl(48 92% 53%), hsl(38 92% 58%))"
                }}
              >
                {/* Bubbles animation */}
                {percentage > 10 && (
                  <div className="absolute inset-0 overflow-hidden rounded-t-full">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-white/40 rounded-full"
                        initial={{ bottom: 0, left: `${25 + i * 25}%` }}
                        animate={{ bottom: ["0%", "100%"], opacity: [0.4, 0] }}
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
          </div>

          {/* Bulb at bottom */}
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center -mt-4 z-10 shadow-lg"
            style={{
              background: isCompleted 
                ? "linear-gradient(135deg, hsl(142 70% 45%), hsl(152 70% 50%))"
                : "linear-gradient(135deg, hsl(48 92% 53%), hsl(38 92% 58%))"
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-center"
            >
              <span className="text-xl font-black text-primary-foreground">{percentage.toFixed(0)}%</span>
            </motion.div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="flex-1 flex flex-col gap-3 justify-center min-w-0">
          {/* Current Value - Main highlight */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-xl border-2 border-primary bg-primary/10"
          >
            <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-primary">{formatCurrency(atual)}</p>
              <p className="text-lg font-bold text-foreground">({percentage.toFixed(0)}%)</p>
            </div>
          </motion.div>

          {/* Status indicator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className={`p-3 rounded-xl border ${
              isAhead 
                ? "bg-success/10 border-success/30" 
                : "bg-warning/10 border-warning/30"
            }`}
          >
            <div className="flex items-center gap-2">
              {isAhead ? (
                <>
                  <TrendingUp className="w-5 h-5 text-success" />
                  <div>
                    <span className="text-sm font-bold text-success">Acima do esperado!</span>
                    <p className="text-xs text-muted-foreground">
                      +{formatCurrency(atual - ondeDeveria)} à frente
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-warning" />
                  <div>
                    <span className="text-sm font-bold text-warning">Acelerar vendas!</span>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(ondeDeveria - atual)} atrás do esperado
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* What's left */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="p-3 rounded-xl bg-accent/10 border border-accent/30"
          >
            <p className="text-sm text-muted-foreground">Falta para Meta</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(quantoFalta)}</p>
          </motion.div>
        </div>
      </div>

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
            <p className="text-2xl font-black text-success mt-2 font-racing">META BATIDA!</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
