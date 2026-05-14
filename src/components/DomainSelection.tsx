import { motion } from "framer-motion";
import { useState } from "react";
import type { VetraState } from "../App";
import {
  Code2,
  Database,
  Lightbulb,
  PenTool,
  Briefcase,
  Megaphone,
  Cloud,
  MoreHorizontal,
  CheckCircle2,
} from "lucide-react";

const domains = [
  {
    id: "Software Engineering",
    icon: Code2,
    desc: "Frontend, Backend, Fullstack",
  },
  { id: "Data Science / ML", icon: Database, desc: "AI, Data, Analytics" },
  {
    id: "Product Management",
    icon: Lightbulb,
    desc: "Strategy, Agile, Roadmaps",
  },
  { id: "UI/UX Design", icon: PenTool, desc: "Research, Wireframes, UI" },
  {
    id: "Business / Finance",
    icon: Briefcase,
    desc: "Analysis, Strategy, Banking",
  },
  { id: "Marketing", icon: Megaphone, desc: "Growth, Content, SEO" },
  { id: "DevOps / Cloud", icon: Cloud, desc: "AWS, CI/CD, Infrastructure" },
  { id: "Other", icon: MoreHorizontal, desc: "Custom domain" },
];

export default function DomainSelection({
  onNext,
  state,
  updateState,
}: {
  onNext: () => void;
  state: VetraState;
  updateState: (key: keyof VetraState, val: any) => void;
}) {
  const [selected, setSelected] = useState(state.domain || "");
  const [customDomain, setCustomDomain] = useState("");

  const handleNext = () => {
    if (selected === "Other" && customDomain.trim() !== "") {
      updateState("domain", customDomain.trim());
    } else {
      updateState("domain", selected);
    }
    onNext();
  };

  const isNextDisabled =
    !selected || (selected === "Other" && !customDomain.trim());

  return (
    <motion.div
      className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 w-full max-w-6xl mx-auto"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100, filter: "blur(10px)" }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          What role are you preparing for?
        </h2>
        <p className="text-gray-400 text-lg">
          We tailor your entire evaluation to your domain
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8">
        {domains.map((domain, i) => {
          const isSelected = selected === domain.id;
          return (
            <motion.div
              key={domain.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => setSelected(domain.id)}
              className={`relative cursor-pointer rounded-xl p-6 transition-all duration-300 ${
                isSelected
                  ? "bg-primary/20 border-primary shadow-[0_0_30px_rgba(124,58,237,0.3)]"
                  : "glass border-white/5 hover:border-white/20"
              } border`}
            >
              {isSelected && (
                <motion.div
                  initial={{ rotate: -90, opacity: 0, scale: 0 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  className="absolute top-4 right-4 text-primary"
                >
                  <CheckCircle2 className="w-6 h-6" />
                </motion.div>
              )}
              <domain.icon
                className={`w-10 h-10 mb-4 ${isSelected ? "text-primary" : "text-gray-400"}`}
              />
              <h3 className="font-bold text-lg mb-1">{domain.id}</h3>
              <p className="text-sm text-gray-400">{domain.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {selected === "Other" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="w-full max-w-md mb-8"
        >
          <input
            type="text"
            placeholder="Type your domain..."
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            className="w-full bg-black/50 border border-primary/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent glass transition-all"
          />
        </motion.div>
      )}

      <motion.button
        onClick={handleNext}
        disabled={isNextDisabled}
        className={`px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 transition-all ${
          isNextDisabled
            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
            : "bg-white text-black hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
        }`}
        whileTap={!isNextDisabled ? { scale: 0.95 } : undefined}
      >
        Continue{" "}
        <motion.span
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          →
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
