import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { VetraState } from '../App';
import { analyzeWithGemini } from '../lib/gemini';
import { Share2, RefreshCw, CheckCircle, XCircle, Calendar } from 'lucide-react';

export default function ScoreReveal({ state, onRestart }: { state: VetraState, onRestart: () => void }) {
  const [verdictData, setVerdictData] = useState<any>(null);
  const [calculating, setCalculating] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');



  useEffect(() => {
    const calculateFinal = async () => {
      try {
        const resumeScore = state.resumeData?.resumeScore || 0;
        const portfolioScore = state.portfolioData?.portfolioScore || 0;
        const commScore = state.finalData?.communicationScore || 0;
        const techScore = state.finalData?.technicalScore || 0;


        const systemPrompt = `
          You are an AI-powered Recruiter-Level Adaptive Evaluator. 
          Goal: Analyze if this candidate is "The Real Deal" or "A Paper Tiger".
          
          VERIFICATION:
          Compare Resume claims vs GitHub data. Flag contradictions.
          (Example: Claiming expert AI skills but having 0 AI repos on GitHub).
          
          DOMAIN: ${state.domain}
          RESUME DATA: ${JSON.stringify(state.resumeData)}
          GITHUB DATA: ${JSON.stringify(state.githubData)}
          PORTFOLIO DATA: ${JSON.stringify(state.portfolioData)}
          INTERVIEW DATA: ${JSON.stringify(state.finalData)}
          
          ANTI-REPEAT: If this analysis would apply to a different user, REWRITE IT to be more specific.
          
          Return ONLY JSON:
          {
            "verdict": "Unique, non-generic verdict. Must mention specific repos/claims.",
            "topStrengths": ["Strength 1 (specific)", "Strength 2"],
            "criticalGaps": ["Gap 1 (linked to input)", "Gap 2"],
            "whyNoFullMarks": "Explanation of why exactly they didn't get 100/100",
            "weekPlan": ["Day 1 specific action", "Day 2"],
            "hireProbability": "XX% - Based on domain relevance",
            "contradictions": ["Resume claim X not found in GitHub", "etc"]
          }
        `;

        const finalVerdict = await analyzeWithGemini(systemPrompt, "Generate final verdict.");
        
        const finalScore = Math.round(
          (resumeScore * 0.25) + 
          (commScore * 0.25) + 
          (techScore * 0.40) + 
          (portfolioScore * 0.10)
        );

        setVerdictData({ ...finalVerdict, finalScore });
      } catch (err) {
        console.error(err);
        setError("Failed to generate final verdict. Please check your API key.");

      } finally {
        setTimeout(() => setCalculating(false), 2000); // Dramatic pause
        setTimeout(() => setShowResults(true), 3500); // Full black screen for 1.5s
      }
    };

    calculateFinal();
  }, []);

  const getGrade = (score: number) => {
    if (score >= 80) return { text: "HIRE-READY", color: "#10B981", glow: "rgba(16,185,129,0.5)" };
    if (score >= 60) return { text: "ALMOST THERE", color: "#06B6D4", glow: "rgba(6,182,212,0.5)" };
    if (score >= 40) return { text: "NEEDS WORK", color: "#F59E0B", glow: "rgba(245,158,11,0.5)" };
    return { text: "NOT YET", color: "#EF4444", glow: "rgba(239,68,68,0.5)" };
  };

  const copyToClipboard = () => {
    const text = `My VETRA Score for ${state.domain}: ${verdictData.finalScore}/100 (${getGrade(verdictData.finalScore).text})\\n\\nProbability of passing screening: ${verdictData.hireProbability}\\n\\nCheck your readiness at VETRA.`;
    navigator.clipboard.writeText(text);
    alert("Score summary copied to clipboard! (Screenshot flash effect!)");
  };

  if (calculating) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl font-heading font-bold text-white mb-8"
        >
          Calculating VETRA Score
        </motion.div>
        <div className="flex gap-2">
          {[...Array(10)].map((_, i) => (
            <motion.div 
              key={i} className="w-2 bg-gradient-to-t from-primary to-secondary"
              animate={{ height: [20, 100, 20] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
        <div className="glass p-8 rounded-2xl border border-red-500/30 text-center max-w-md">
          <h3 className="text-2xl font-bold text-red-500 mb-4">Evaluation Error</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={onRestart} className="px-8 py-3 rounded-full bg-white text-black font-bold">Try Again</button>
        </div>
      </div>
    );
  }

  if (!showResults) {
    return <div className="fixed inset-0 z-50 bg-black"></div>; // Dramatic black screen
  }

  const grade = getGrade(verdictData.finalScore);
  
  const allMarkups = [
    ...(state.resumeData?.teacherMarkup?.map((m: any) => ({ ...m, source: 'Resume' })) || []),
    ...(state.githubData?.teacherMarkup?.map((m: any) => ({ ...m, source: 'GitHub', text: m.item })) || []),
    ...(state.portfolioData?.teacherMarkup?.map((m: any) => ({ ...m, source: 'Portfolio', text: m.item })) || []),
    ...(state.finalData?.teacherMarkup?.map((m: any) => ({ ...m, source: 'Interview', text: m.quote })) || []),
  ];

  return (
    <motion.div 
      className="relative z-10 min-h-screen flex flex-col items-center p-6 w-full max-w-6xl mx-auto pt-10 pb-20"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <motion.div 
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, duration: 1 }}
        className="relative flex flex-col items-center mb-16"
      >
        <div 
          className="w-64 h-64 rounded-full flex flex-col items-center justify-center relative bg-black/80 backdrop-blur-xl border-4"
          style={{ borderColor: grade.color, boxShadow: `0 0 80px ${grade.glow}, inset 0 0 40px ${grade.glow}` }}
        >
          <motion.span 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="text-7xl font-bold font-heading text-white"
          >
            {verdictData.finalScore}
          </motion.span>
          <motion.span 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.5, type: "spring" }}
            className="text-xl font-bold mt-2 tracking-widest px-4 py-1 rounded border bg-black/50"
            style={{ color: grade.color, borderColor: grade.color }}
          >
            {grade.text}
          </motion.span>
        </div>
        
        {/* Metric Cards */}
        <div className="flex flex-wrap justify-center gap-4 mt-12 w-full">
          {[
            { label: 'Resume', score: state.resumeData?.resumeScore || 0, color: '#7C3AED' },
            { label: 'GitHub', score: state.githubData?.githubScore || 0, color: '#06B6D4' },
            { label: 'Portfolio', score: state.portfolioData?.portfolioScore || 0, color: '#EC4899' },
            { label: 'Comm', score: state.finalData?.communicationScore || 0, color: '#10B981' },
            { label: 'Tech', score: state.finalData?.technicalScore || 0, color: '#F59E0B' },
          ].map((m, i) => (
            <motion.div 
              key={i}
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 2 + i * 0.15 }}
              className="glass p-4 rounded-xl flex flex-col items-center w-32 border border-white/10"
            >
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{m.label}</div>
              <div className="text-2xl font-bold" style={{ color: m.color }}>{m.score}</div>
              <div className="w-full h-1 mt-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full" style={{ backgroundColor: m.color }} initial={{ width: 0 }} animate={{ width: `${m.score}%` }} transition={{ delay: 2.5 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 2.5 }} className="space-y-8">
          <div className="glass p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 font-bold text-2xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" style={{ color: grade.color }}>
              {verdictData.hireProbability}
            </div>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">Recruiter's Verdict</h3>
            <p className="text-lg italic text-gray-300 leading-relaxed">"{verdictData.verdict}"</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-6 rounded-2xl border-t-4 border-green-500">
              <h4 className="font-bold mb-4 text-green-400 flex items-center gap-2"><CheckCircle size={18} /> Top Strengths</h4>
              <ul className="space-y-3">
                {verdictData.topStrengths?.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-300">{s}</li>
                ))}
              </ul>
            </div>
            <div className="glass p-6 rounded-2xl border-t-4 border-red-500">
              <h4 className="font-bold mb-4 text-red-400 flex items-center gap-2"><XCircle size={18} /> Critical Gaps</h4>
              <ul className="space-y-3">
                {verdictData.criticalGaps?.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-300">{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 2.8 }} className="space-y-8">
          <div className="glass p-8 rounded-2xl border border-primary/30 shadow-[0_0_30px_rgba(124,58,237,0.1)]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary"><Calendar /> Path to 100% (Week-1 Action Plan)</h3>
            <div className="space-y-4">
              {verdictData.weekPlan?.map((plan: string, i: number) => (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 3 + i * 0.2 }}
                  key={i} className="flex gap-4 p-3 rounded-lg bg-black/40 border border-white/5"
                >
                  <div className="font-bold text-gray-500 font-mono">DAY {i+1}</div>
                  <div className="text-sm text-gray-300 flex-1">{plan}</div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/10">
              <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Deduction Reasoning</h4>
              <div className="space-y-3">
                {[
                  ...(state.resumeData?.scoreJustification || []),
                  ...(state.portfolioData?.scoreJustification || []),
                  ...(state.finalData?.communicationJustification || []),
                  ...(state.finalData?.technicalJustification || [])
                ].slice(0, 6).map((reason, i) => (
                  <div key={i} className="text-xs text-red-400 flex items-start gap-2">
                    <span className="opacity-50">•</span> {reason}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl max-h-80 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 sticky top-0 bg-[#080810]/80 backdrop-blur pb-2 z-10 text-white">Full Red Pen Review 📝</h3>
            <div className="space-y-4">
              {allMarkups.map((m: any, i: number) => (
                <div key={i} className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <span className="text-xs px-2 py-1 bg-white/10 rounded text-gray-400 mb-2 inline-block">{m.source}</span>
                  <p className="text-sm text-gray-400 line-through decoration-red-500 decoration-2 mb-2">"{m.text}"</p>
                  <p className="text-md text-green-400 font-medium flex items-center gap-2">→ {m.fix}</p>
                </div>
              ))}
              {state.finalData?.improvedIntro && (
                <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <h4 className="text-sm font-bold text-primary mb-2 italic">Improved Sample Intro:</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">"{state.finalData.improvedIntro}"</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 4 }} className="flex gap-6 mt-16">
        <button 
          onClick={copyToClipboard}
          className="px-8 py-4 rounded-full bg-white text-black font-bold flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Share2 size={20} /> Share My Score
        </button>
        <button 
          onClick={onRestart}
          className="px-8 py-4 rounded-full border border-white/20 text-white font-bold flex items-center gap-2 hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={20} /> Start Over
        </button>
      </motion.div>
    </motion.div>
  );
}
