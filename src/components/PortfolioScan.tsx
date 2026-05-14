import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import type { VetraState } from '../App';
import { UploadCloud, CheckCircle, Globe } from 'lucide-react';
import * as mammoth from 'mammoth';
import { analyzeWithGemini, hasApiKey } from '../lib/gemini';

export default function PortfolioScan({ 
  onNext, 
  state, 
  updateState 
}: { 
  onNext: () => void; 
  state: VetraState; 
  updateState: (key: keyof VetraState, val: any) => void;
}) {
  const [hasPortfolio, setHasPortfolio] = useState<boolean | null>(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    try {
      let extracted = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        extracted = await extractTextFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extracted = result.value;
      } else {
        throw new Error("Unsupported file format.");
      }
      setText(extracted);
    } catch (err: any) {
      setError(err.message || 'Error parsing file');
    }
  };

  const handleScan = async () => {
    if (!hasApiKey()) {
      setError("API Key is missing.");
      return;
    }

    setIsScanning(true);
    setError('');

    let extractedWeb = '';
    if (url) {
      try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        const html = data.contents;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        extractedWeb = doc.body.innerText.replace(/\s+/g, ' ').substring(0, 3000); 
      } catch (err) {
        console.warn("Could not fetch portfolio URL, continuing with URL only.");
      }
    }

    const systemPrompt = `
        You are an AI-powered Recruiter-Level Portfolio Auditor. Evaluate the portfolio for a ${state.domain} role.
        URL: ${url}
        Page Content: ${extractedWeb}
        Document Text: ${text}
        
        CRITERIA (0-100):
        1. Structure & design clarity
        2. Real-world project depth & technical credibility
        3. Working links & GitHub presence
        
        OUTPUT FORMAT (JSON):
        {
          "portfolioScore": number,
          "scoreJustification": ["Deduction reason 1 (e.g. -5)", "Reason 2 (-10)"],
          "improvementsRequired": ["Specific step 1 to reach 100%", "Step 2"],
          "firstImpression": "string",
          "visualPresentation": number,
          "projectRelevance": number,
          "technicalDepth": number,
          "missingElements": string[],
          "teacherMarkup": [{ "item": "specific element", "issue": "why it's weak", "fix": "exact fix" }]
        }
      `;

    try {
      const data = await analyzeWithGemini(systemPrompt, "Evaluate this portfolio.");
      setResults(data);
      updateState('portfolioData', data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze portfolio');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSkip = () => {
    updateState('portfolioData', { portfolioScore: 0 });
    onNext();
  };

  if (results) {
    return (
      <motion.div 
        className="relative z-10 min-h-screen flex flex-col p-6 w-full max-w-5xl mx-auto pt-20"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 glass p-8 rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="font-heading text-2xl font-bold mb-6">Portfolio Score</h3>
            <div className="relative w-48 h-48 rounded-full flex items-center justify-center bg-black/50 border border-white/10 shadow-[0_0_50px_rgba(236,72,153,0.2)]">
              <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <motion.circle 
                  cx="96" cy="96" r="88" fill="none" 
                  stroke="#EC4899" strokeWidth="8"
                  strokeDasharray="553"
                  initial={{ strokeDashoffset: 553 }}
                  animate={{ strokeDashoffset: 553 - (553 * results.portfolioScore) / 100 }}
                  transition={{ duration: 2, type: "spring", bounce: 0.4 }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-5xl font-bold font-heading">{results.portfolioScore}</div>
            </div>
            
            <div className="w-full mt-8 space-y-4">
              {[
                { name: 'Visual', val: results.visualPresentation },
                { name: 'Relevance', val: results.projectRelevance },
                { name: 'Tech Depth', val: results.technicalDepth },
                { name: 'Storytelling', val: results.storytelling }
              ].map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-1 text-gray-300">
                    <span>{item.name}</span>
                    <span>{item.val}/100</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.val}%` }}
                      transition={{ duration: 1.5, type: "spring" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:w-2/3 space-y-6">
            <div className="glass p-6 rounded-2xl border-l-4 border-l-accent">
              <p className="italic text-gray-300">"{results.firstImpression}"</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass p-6 rounded-2xl">
                <h4 className="font-bold text-lg mb-4 text-green-400">Strong Points</h4>
                <div className="flex flex-wrap gap-2">
                  {results.strongPoints?.map((p: string, i: number) => (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }} key={i} className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">{p}</motion.span>
                  ))}
                </div>
              </div>
              <div className="glass p-6 rounded-2xl">
                <h4 className="font-bold text-lg mb-4 text-red-400">Missing Elements</h4>
                <div className="flex flex-wrap gap-2">
                  {results.missingElements?.map((p: string, i: number) => (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }} key={i} className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400">{p}</motion.span>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <h4 className="font-bold text-xl mb-4 text-white flex items-center gap-2">Portfolio Red Pen ✍️</h4>
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

            <div className="flex justify-end pt-2">
              <motion.button
                onClick={onNext}
                className="px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 bg-white text-black hover:scale-105 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                Continue to Final Evaluation →
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 w-full max-w-3xl mx-auto"
      initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}
    >
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">Portfolio & Projects</h2>
        <p className="text-gray-400 text-lg">Let's see what you've built.</p>
      </div>

      {hasPortfolio === null ? (
        <div className="glass p-12 rounded-2xl text-center max-w-xl w-full">
          <h3 className="text-2xl font-bold mb-8">Do you have a portfolio website?</h3>
          <div className="flex justify-center gap-6">
            <button onClick={() => setHasPortfolio(true)} className="px-8 py-3 rounded-full bg-primary hover:bg-primary/80 transition-colors font-bold text-lg">YES</button>
            <button onClick={() => setHasPortfolio(false)} className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-bold text-lg">NO</button>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-8">
          {hasPortfolio && (
            <div className="glass p-8 rounded-2xl">
              <label className="block text-lg font-bold mb-4 flex items-center gap-2"><Globe /> Enter your live portfolio URL</label>
              <input
                type="url"
                className="w-full bg-black/50 border border-white/20 focus:border-accent rounded-lg px-4 py-3 text-white focus:outline-none transition-all shadow-[0_0_0_0_rgba(236,72,153,0)] focus:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                placeholder="https://myportfolio.com"
                value={url} onChange={e => setUrl(e.target.value)}
              />
            </div>
          )}

          <div className="glass p-8 rounded-2xl">
            <label className="block text-lg font-bold mb-4">Upload your portfolio document (optional)</label>
            <div 
              className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
              {fileName ? (
                <div className="text-green-400 text-center"><CheckCircle className="w-8 h-8 mb-2 mx-auto" />{fileName}</div>
              ) : (
                <><UploadCloud className="w-8 h-8 text-gray-500 mb-2" /><p className="text-gray-400">Drag & Drop PDF/DOCX</p></>
              )}
            </div>
          </div>

          {error && <p className="text-red-400 text-center font-bold">{error}</p>}

          <div className="flex justify-between items-center pt-4">
            <button onClick={handleSkip} className="text-gray-500 hover:text-white transition-colors">Skip This Step</button>
            <button 
              onClick={handleScan}
              disabled={isScanning || (!url && !text && hasPortfolio)}
              className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {isScanning ? "Scanning..." : "Analyze Portfolio →"}
            </button>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="fixed top-0 left-0 w-full h-1 bg-white/10 z-50">
          <motion.div 
            className="h-full bg-accent"
            animate={{ width: ["0%", "100%", "0%"], x: ["0%", "0%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      )}
    </motion.div>
  );
}
