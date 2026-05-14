import { motion } from 'framer-motion';
import { useState } from 'react';
import type { VetraState } from '../App';
import { analyzeWithGemini } from '../lib/gemini';
import { MessageSquare, Code } from 'lucide-react';

const domainQuestions: Record<string, string> = {
  'Software Engineering': "Explain the difference between REST and GraphQL. When would you choose one over the other?",
  'Data Science / ML': "Explain overfitting and how you would prevent it in a machine learning model.",
  'Product Management': "How would you prioritize features for a product with limited engineering resources?",
  'UI/UX Design': "Walk me through your design process for a new mobile app feature.",
  'Business / Finance': "How would you evaluate whether a startup is worth investing in?",
  'Marketing': "How would you build a go-to-market strategy for a new B2B SaaS product?",
  'DevOps / Cloud': "Explain the difference between Docker and Kubernetes and when to use each.",
};

export default function FinalEvaluation({ 
  onNext, 
  state, 
  updateState 
}: { 
  onNext: () => void; 
  state: VetraState; 
  updateState: (key: keyof VetraState, val: any) => void;
}) {
  const [intro, setIntro] = useState('');
  const [techAnswer, setTechAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState('');

  // Fallback question if domain matches 'Other' or is not found
  const question = domainQuestions[state.domain] || "Describe a complex problem you solved and your approach to solving it.";

  const handleEvaluate = async () => {
    if (!intro.trim() || !techAnswer.trim()) {
      setError("Please answer both questions.");
      return;
    }

    setIsEvaluating(true);
    setError('');

    const systemPrompt = `
        You are an AI-powered Recruiter and Interview Coach. Evaluate the candidate for a ${state.domain} role.
        
        COMMUNICATION TASK (0-100):
        - Structure (Intro -> Skills -> Experience -> Goal)
        - Clarity, Grammar, Fluency
        - Ideal length: 30-60 seconds
        
        TECHNICAL TASK (0-100):
        - Correctness, Terminology, Depth
        
        OUTPUT FORMAT (JSON):
        {
          "communicationScore": number,
          "technicalScore": number,
          "communicationJustification": ["Reason for deduction 1", "Reason 2"],
          "technicalJustification": ["Reason for deduction 1", "Reason 2"],
          "improvedIntro": "A 100/100 version of the candidate's self-introduction",
          "improvedTechnical": "A 100/100 version of the technical answer",
          "communicationBreakdown": { clarity: number, structure: number, confidence: number, vocabulary: number },
          "technicalBreakdown": { accuracy: number, depth: number, practicalKnowledge: number },
          "teacherMarkup": [{ "quote": "sentence from answer", "issue": "why it fails", "fix": "improved version" }]
        }
      `;

    try {
      const data = await analyzeWithGemini(systemPrompt, "Evaluate this candidate's answers.");
      updateState('finalData', data);
      onNext();
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate answers');
      setIsEvaluating(false);
    }
  };

  return (
    <motion.div 
      className="relative z-10 min-h-screen flex flex-col p-6 w-full max-w-5xl mx-auto pt-20"
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, filter: "blur(10px)" }}
    >
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">Final Evaluation</h2>
        <p className="text-gray-400 text-lg">The interview simulation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="glass p-6 rounded-2xl flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-primary flex items-center gap-2 mb-2"><MessageSquare /> Tell us about yourself</h3>
            <p className="text-sm text-gray-400">Speak as you would at the start of an interview. Try to cover your background, skills, and goals. Aim for about 30-40 seconds worth of content.</p>
          </div>
          <div className="relative flex-1">
            <textarea
              className="w-full h-full min-h-[250px] bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary/50 resize-none"
              placeholder="I am..."
              value={intro}
              onChange={e => setIntro(e.target.value)}
            />
            <div className="absolute bottom-4 right-4 text-xs text-gray-500 font-mono">
              {intro.split(/\\s+/).filter(w => w.length > 0).length} words
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-secondary flex items-center gap-2 mb-2"><Code /> Technical Question</h3>
            <p className="text-sm text-white font-mono bg-white/5 p-3 rounded border border-white/10 mt-2">
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}>{question}</motion.span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>_</motion.span>
            </p>
          </div>
          <div className="relative flex-1">
            <textarea
              className="w-full h-full min-h-[200px] bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-secondary/50 resize-none"
              placeholder="Your answer..."
              value={techAnswer}
              onChange={e => setTechAnswer(e.target.value)}
            />
            <div className="absolute bottom-4 right-4 text-xs text-gray-500 font-mono">
              {techAnswer.split(/\\s+/).filter(w => w.length > 0).length} words
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-center font-bold mb-4">{error}</p>}

      <div className="flex justify-center">
        <motion.button
          onClick={handleEvaluate}
          disabled={isEvaluating}
          className="px-10 py-5 rounded-full bg-gradient-to-r from-primary via-secondary to-accent text-white font-bold text-xl hover:scale-105 shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3"
        >
          {isEvaluating ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Measuring technical depth...
            </>
          ) : "Generate My VETRA Score →"}
        </motion.button>
      </div>
    </motion.div>
  );
}
