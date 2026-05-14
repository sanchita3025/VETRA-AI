import { motion } from 'framer-motion';
import { useState } from 'react';
import type { VetraState } from '../App';
import { GitBranch, AlertTriangle, CheckCircle } from 'lucide-react';
import { analyzeWithGemini, hasApiKey } from '../lib/gemini';

export default function GithubScan({ 
  onNext, 
  state, 
  updateState 
}: { 
  onNext: () => void; 
  state: VetraState; 
  updateState: (key: keyof VetraState, val: any) => void;
}) {
  const [username, setUsername] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleScan = async () => {
    let cleanUsername = username.trim().replace('https://github.com/', '').replace('/', '');
    if (!cleanUsername) {
      setError("Please enter a valid GitHub username.");
      return;
    }
    
    if (!hasApiKey()) {
      setError("API Key is missing. Please restart and provide it on the resume screen if you didn't.");
      return;
    }

    setIsScanning(true);
    setError('');

    try {
      // Fetch GitHub data
      const profileRes = await fetch(`https://api.github.com/users/${cleanUsername}`);
      if (!profileRes.ok) throw new Error("GitHub user not found");
      const profile = await profileRes.json();

      const reposRes = await fetch(`https://api.github.com/users/${cleanUsername}/repos?sort=updated&per_page=20`);
      const repos = await reposRes.json();



      // Aggregate languages
      const languages: Record<string, number> = {};
      const topRepos = repos.slice(0, 5);
      for (const repo of topRepos) {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      }



      const systemPrompt = `
        You are an AI GitHub Auditor. Your goal is to determine: "What is this person actually trying to become?"
        
        ANTI-REPEAT CHECK:
        If you are using a generic template, STOP. Every output must be unique to THIS candidate's repos and languages.
        
        CRITERIA (0-100):
        1. Repo relevance to ${state.domain}
        2. Languages used (Check if they match domain expectations)
        3. README quality (Shows communication skills)
        4. Consistency of commits (Active vs abandoned)
        5. Project complexity vs stated level
        
        GITHUB DATA:
        User: ${cleanUsername}
        Repos: ${repos.map((r: any) => r.name).join(', ')}
        
        OUTPUT FORMAT (JSON):
        {
          "githubScore": number,
          "scoreJustification": ["Specific reason based on repo X (-10)", "Reason 2"],
          "profileStrength": { consistency: number, projectQuality: number, techDepth: number, collaboration: number, documentation: number },
          "topLanguages": string[],
          "strongRepos": string[],
          "weakRepos": string[],
          "missingForDomain": ["Skill X needed for ${state.domain}"],
          "recruiterVerdict": "Brutally honest verdict on whether their GitHub supports their ${state.domain} claims.",
          "teacherMarkup": [{ "item": "repo-name", "issue": "why it's weak", "fix": "exact fix" }],
          "improvements": ["Step 1", "Step 2"]
        }
      `;

      const data = await analyzeWithGemini(systemPrompt, "Evaluate this GitHub profile.");
      setResults({ ...data, avatar_url: profile.avatar_url });
      updateState('githubData', data);

    } catch (err: any) {
      setError(err.message || 'Failed to analyze GitHub profile');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSkip = () => {
    updateState('githubData', { githubScore: 0 });
    onNext();
  };

  if (results) {
    return (
      <motion.div 
        className="relative z-10 min-h-screen flex flex-col p-6 w-full max-w-6xl mx-auto pt-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3 space-y-6">
            <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center text-center">
              <motion.img 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                src={results.avatar_url} alt="GitHub Avatar" 
                className="w-32 h-32 rounded-full border-4 border-primary mb-4 shadow-[0_0_30px_rgba(124,58,237,0.5)]" 
              />
              <h3 className="font-heading text-2xl font-bold mb-4">GitHub Score</h3>
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-8">
                {results.githubScore}
              </div>
              
              <div className="w-full space-y-4 text-left">
                {Object.entries(results.profileStrength).map(([key, val]: [string, any]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1 capitalize text-gray-400">
                      <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span>{val}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-cyan-400"
                        initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border-l-4 border-l-secondary">
              <p className="italic text-gray-300">"{results.recruiterVerdict}"</p>
            </div>
          </div>

          <div className="lg:w-2/3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-2xl">
                <h4 className="font-bold text-lg mb-4 text-green-400">Strong Repositories</h4>
                <ul className="space-y-2">
                  {results.strongRepos?.map((r: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm"><CheckCircle size={14} className="text-green-500" /> {r}</li>
                  ))}
                </ul>
              </div>
              <div className="glass p-6 rounded-2xl">
                <h4 className="font-bold text-lg mb-4 text-red-400">Needs Work</h4>
                <ul className="space-y-2">
                  {results.weakRepos?.map((r: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm"><AlertTriangle size={14} className="text-red-500" /> {r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <h4 className="font-bold text-xl mb-4 text-white flex items-center gap-2">Profile Red Pen ✍️</h4>
              <div className="space-y-4">
                {results.teacherMarkup?.map((m: any, i: number) => (
                  <div key={i} className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <p className="text-sm font-bold text-gray-300 mb-1">{m.item}</p>
                    <p className="text-sm text-gray-500 mb-2 italic">Issue: {m.issue}</p>
                    <p className="text-md text-green-400 font-medium flex items-center gap-2">→ {m.fix}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <h4 className="font-bold text-xl mb-4 text-white">Actionable Tips</h4>
              <div className="grid gap-3">
                {results.improvements?.map((tip: string, i: number) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                    key={i} className="border-l-4 border-primary bg-white/5 p-4 rounded-r-lg text-sm"
                  >
                    {tip}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <motion.button
                onClick={onNext}
                className="px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 bg-white text-black hover:scale-105 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                Continue to Portfolio →
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 flex items-center justify-center gap-4">
          <GitBranch className="w-12 h-12" /> GitHub Analysis
        </h2>
        <p className="text-gray-400 text-lg">Paste your GitHub username or full profile URL</p>
      </div>

      <div className="w-full relative group mb-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative glass rounded-xl p-2 flex items-center">
          <span className="pl-4 text-gray-500 font-mono">github.com/</span>
          <input
            type="text"
            className="w-full bg-transparent border-none px-2 py-4 text-white text-xl focus:outline-none font-mono"
            placeholder="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
          />
        </div>
      </div>

      {isScanning && (
        <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center backdrop-blur-md">
          <div className="font-mono text-green-500 text-xl mb-4">Crawling your GitHub activity...</div>
          <div className="flex flex-col gap-2 opacity-50">
            {[...Array(5)].map((_, i) => (
              <motion.div 
                key={i} 
                className="text-green-500 font-mono text-xs"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 100 }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              >
                {Math.random().toString(36).substring(2, 15)}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 mb-6 font-bold">{error}</p>}

      <div className="flex gap-4">
        <motion.button
          onClick={handleSkip}
          className="px-6 py-3 rounded-full font-bold text-gray-400 hover:text-white transition-colors"
        >
          Skip This Step
        </motion.button>
        <motion.button
          onClick={handleScan}
          disabled={isScanning || !username}
          className={`px-8 py-3 rounded-full font-bold text-lg transition-all ${
            isScanning || !username 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-black hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
          }`}
          whileTap={!isScanning && username ? { scale: 0.95 } : undefined}
        >
          Scan GitHub →
        </motion.button>
      </div>
    </motion.div>
  );
}
