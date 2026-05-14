import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function BackgroundBars({
  step,
  domain,
}: {
  step: number;
  domain: string;
}) {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    // Generate 55 bars with random initial heights and speeds
    setBars(Array.from({ length: 55 }).map(() => Math.random()));
  }, []);

  const getColor = () => {
    if (step === 0) return ["#7C3AED", "#06B6D4", "#EC4899"];
    if (domain.includes("Software") || domain.includes("DevOps"))
      return ["#7C3AED", "#8B5CF6", "#A78BFA"];
    if (domain.includes("Design")) return ["#06B6D4", "#22D3EE", "#67E8F9"];
    if (domain.includes("Business") || domain.includes("Product"))
      return ["#EC4899", "#F472B6", "#F9A8D4"];
    return ["#7C3AED", "#06B6D4", "#EC4899"];
  };

  const colors = getColor();

  return (
    <div className="fixed bottom-0 left-0 w-full h-48 flex items-end justify-center gap-1 opacity-40 pointer-events-none z-0 overflow-hidden">
      {bars.map((b, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-t-sm"
          style={{
            backgroundColor: colors[i % colors.length],
            boxShadow: `0 0 10px ${colors[i % colors.length]}`,
          }}
          animate={{
            height: [`${10 + b * 20}%`, `${30 + b * 70}%`, `${10 + b * 20}%`],
          }}
          transition={{
            duration: 0.5 + b * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Floating Orbs */}
      <motion.div
        className="absolute w-64 h-64 bg-primary/20 rounded-full blur-[80px]"
        animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-64 h-64 bg-secondary/20 rounded-full blur-[80px] right-20 bottom-20"
        animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
      />
    </div>
  );
}
