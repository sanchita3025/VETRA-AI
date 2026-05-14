import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import type { VetraState } from '../App';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
import * as mammoth from 'mammoth';
import { analyzeWithGemini, hasApiKey, setApiKey } from '../lib/gemini';

export default function ResumeScan({ 
  onNext, 
  state, 
  updateState 
}: { 
  onNext: () => void; 
  state: VetraState; 
  updateState: (key: keyof VetraState, val: any) => void;
}) {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiKeyInput, setApiKeyInput] = useState('');

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

  const extractTextFromDocx = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
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
        extracted = await extractTextFromDocx(file);
      } else {
        throw new Error("Unsupported file format. Please upload PDF or DOCX.");
      }
      setText(extracted);
    } catch (err: any) {
      setError(err.message || 'Error parsing file');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    try {
      let extracted = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        extracted = await extractTextFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        extracted = await extractTextFromDocx(file);
      } else {
        throw new Error("Unsupported file format.");
      }
      setText(extracted);
    } catch (err: any) {
      setError(err.message || 'Error parsing file');
    }
  };

  const handleScan = async () => {
    if (!hasApiKey() && !apiKeyInput) {
      setError("Please enter your Google Gemini API Key to continue.");
      return;
    }
    if (apiKeyInput) {
      setApiKey(apiKeyInput);
    }

    if (!text.trim()) {
      setError("Please provide your resume text.");
      return;
    }
    
    setIsScanning(true);
    setError('');
    
    const systemPrompt = `
        You are an AI-powered Recruiter-Level Resume Evaluator. Evaluate the candidate for a ${state.domain} role.
        
        CORE RULES:
        1. Never give a score without explanation.
        2. Link every score to specific parts of the resume.
        3. Explain WHY marks are deducted (e.g., "Missing GitHub link (-8)").
        
        CRITERIA (0-100):
        - Skills relevance (ATS keywords)
        - Projects quality & clarity
        - Missing sections (Experience, Links, LinkedIn, etc.)
        - Professionalism & Formatting
        
        OUTPUT FORMAT (JSON):
        {
          "resumeScore": number,
          "scoreJustification": ["Reason for deduction 1 (e.g. -10)", "Reason 2 (-5)"],
          "improvementsRequired": ["Step 1 to reach 100%", "Step 2"],
          "strongKeywords": string[],
          "missingKeywords": string[],
          "sectionScores": { education: number, experience: number, skills: number, projects: number, formatting: number },
          "teacherMarkup": [{ "text": "sentence from resume", "issue": "why it is weak", "fix": "exact improvement" }],
          "overallFeedback": "Brutally honest recruiter note."
        }
      `;

    try {
      const data = await analyzeWithGemini(systemPrompt, `Resume Text:\n${text}`);
      setResults(data);
      updateState('resumeData', data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume');
    } finally {
      setIsScanning(false);
    }
  };

  if (results) {
    return (
      <motion.div 
        className="relative z-10 min-h-screen flex flex-col p-6 w-full max-w-5xl mx-auto pt-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 glass p-8 rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="font-heading text-2xl font-bold mb-6">Resume Score</h3>
            <div className="relative w-48 h-48 rounded-full flex items-center justify-center bg-black/50 border border-white/10 shadow-[0_0_50px_rgba(124,58,237,0.2)]">
              <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <motion.circle 
                  cx="96" cy="96" r="88" fill="none" 
                  stroke="url(#gradient)" strokeWidth="8"
                  strokeDasharray="553"
                  initial={{ strokeDashoffset: 553 }}
                  animate={{ strokeDashoffset: 553 - (553 * results.resumeScore) / 100 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-5xl font-bold font-heading">{results.resumeScore}</div>
            </div>
            
            <div className="w-full mt-8 space-y-4">
              {Object.entries(results.sectionScores).map(([key, val]: [string, any]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1 capitalize text-gray-300">
                    <span>{key}</span>
                    <span>{val}/100</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:w-2/3 space-y-6">
            <div className="glass p-6 rounded-2xl">
              <h4 className="font-bold text-xl mb-4 text-white">Keyword Analysis</h4>
              <div className="flex flex-wrap gap-2">
                {results.strongKeywords?.map((k: string, i: number) => (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }} key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">{k}</motion.span>
                ))}
                {results.weakKeywords?.map((k: string, i: number) => (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }} key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">{k}</motion.span>
                ))}
                {results.missingKeywords?.map((k: string, i: number) => (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }} key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">{k}</motion.span>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <h4 className="font-bold text-xl mb-4 text-white flex items-center gap-2">Recruiter's Red Pen ✍️</h4>
              <div className="space-y-4">
                {results.teacherMarkup?.map((m: any, i: number) => (
                  <div key={i} className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <p className="text-sm text-gray-400 line-through decoration-red-500 decoration-2 mb-2">"{m.text}"</p>
                    <p className="text-sm text-gray-500 mb-2 italic">Issue: {m.issue}</p>
                    <p className="text-md text-green-400 font-medium flex items-center gap-2">→ {m.fix}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border-l-4 border-l-primary">
              <p className="italic text-gray-300">"{results.overallFeedback}"</p>
            </div>
            
            <div className="flex justify-end">
              <motion.button
                onClick={onNext}
                className="px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 bg-white text-black hover:scale-105 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                Continue to GitHub Scan →
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">Resume DNA Scan</h2>
        <p className="text-gray-400 text-lg">Upload your resume — we'll read every word</p>
      </div>

      {!hasApiKey() && (
        <div className="w-full max-w-2xl mb-6 glass p-4 rounded-xl border-yellow-500/30 border">
          <p className="text-sm text-yellow-200 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Google Gemini API Key required for real AI analysis</p>
          <input 
            type="password"
            placeholder="AIzaSy..."
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
          />
        </div>
      )}

      <div className="w-full max-w-2xl glass rounded-2xl overflow-hidden mb-8">
        <div className="flex border-b border-white/10">
          <button 
            className={`flex-1 py-4 font-bold transition-colors ${tab === 'upload' ? 'bg-primary/20 text-white border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setTab('upload')}
          >
            Upload File
          </button>
          <button 
            className={`flex-1 py-4 font-bold transition-colors ${tab === 'paste' ? 'bg-primary/20 text-white border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setTab('paste')}
          >
            Paste Text
          </button>
        </div>

        <div className="p-8 relative">
          {isScanning && (
            <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary mb-4 animate-pulse">Analyzing your resume...</div>
              <div className="flex gap-1">
                {[...Array(20)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="w-1 bg-cyan-400"
                    animate={{ height: [10, 40, 10] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === 'upload' ? (
            <div 
              className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
              
              {fileName ? (
                <div className="flex flex-col items-center text-green-400">
                  <CheckCircle className="w-12 h-12 mb-4" />
                  <span className="font-bold">{fileName}</span>
                  <span className="text-sm text-gray-400 mt-2">Ready to scan</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-gray-500 mb-4 group-hover:text-primary transition-colors" />
                  <p className="text-lg font-bold text-gray-300 mb-2">Drag and drop your resume</p>
                  <p className="text-sm text-gray-500">Supports PDF and DOCX</p>
                </>
              )}
            </div>
          ) : (
            <textarea
              className="w-full h-64 bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary/50 resize-none glass"
              placeholder="Paste your resume text here..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
          )}

          {text && tab === 'upload' && (
            <div className="mt-6 p-4 bg-black/40 rounded-lg max-h-40 overflow-y-auto text-xs text-gray-400 font-mono relative">
              {isScanning && <div className="laser-line"></div>}
              {text}
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 mb-4 font-bold">{error}</p>}

      <motion.button
        onClick={handleScan}
        disabled={isScanning || !text}
        className={`px-8 py-4 rounded-full font-bold text-lg transition-all ${
          isScanning || !text 
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 shadow-[0_0_30px_rgba(124,58,237,0.4)]'
        }`}
        whileTap={!isScanning && text ? { scale: 0.95 } : undefined}
      >
        Scan My Resume
      </motion.button>
    </motion.div>
  );
}
