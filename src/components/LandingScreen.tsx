import { motion } from "framer-motion";
import { ArrowRight, Zap, Clock, UserCheck } from "lucide-react";

export default function LandingScreen({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGMtMS4xIDAtMi0uOS0yLTJzLjktMiAyLTIgMiAuOSAyIDItLjkgMi0yIDJ6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] opacity-20 pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative mb-6"
      >
        <h1
          className="text-7xl md:text-9xl font-heading font-bold uppercase tracking-tighter glitch-text"
          data-text="VETRA"
        >
          VETRA
        </h1>
      </motion.div>

      <motion.p
        className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl font-light"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        Know where you stand before you walk in.
      </motion.p>

      <motion.div
        className="flex gap-4 mb-16 flex-wrap justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {[
          { icon: Zap, text: "AI-Powered" },
          { icon: Clock, text: "Under 2 Minutes" },
          { icon: UserCheck, text: "Built for Students" },
        ].map((Badge, i) => (
          <div
            key={i}
            className="glass px-4 py-2 rounded-full flex items-center gap-2 text-sm text-gray-300"
          >
            <Badge.icon className="w-4 h-4 text-secondary" />
            <span>{Badge.text}</span>
          </div>
        ))}
      </motion.div>

      <motion.button
        onClick={onNext}
        className="relative group px-12 py-5 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-white/50 animate-[spin_4s_linear_infinite]"
          style={{
            borderImage:
              "linear-gradient(to right, transparent, #fff, transparent) 1",
          }}
        ></div>
        <span className="relative flex items-center gap-2">
          Begin Your Audit
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </motion.button>
    </motion.div>
  );
}
