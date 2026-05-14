import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import LandingScreen from './components/LandingScreen';
import DomainSelection from './components/DomainSelection';
import ResumeScan from './components/ResumeScan';
import GithubScan from './components/GithubScan';
import PortfolioScan from './components/PortfolioScan';
import FinalEvaluation from './components/FinalEvaluation';
import ScoreReveal from './components/ScoreReveal';
import BackgroundBars from './components/BackgroundBars';

export type VetraState = {
  domain: string;
  resumeData: any;
  githubData: any;
  portfolioData: any;
  finalData: any;
};

function App() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<VetraState>({
    domain: '',
    resumeData: null,
    githubData: null,
    portfolioData: null,
    finalData: null,
  });

  const nextStep = () => setStep(s => s + 1);
  const restart = () => {
    setStep(0);
    setState({
      domain: '',
      resumeData: null,
      githubData: null,
      portfolioData: null,
      finalData: null,
    });
  };

  const updateState = (key: keyof VetraState, val: any) => {
    setState(prev => ({ ...prev, [key]: val }));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cursor = document.getElementById('custom-cursor');
      if (cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      <div id="custom-cursor" className="fixed w-4 h-4 bg-primary/50 rounded-full pointer-events-none z-[9999] blur-[2px] transition-transform duration-75 -translate-x-1/2 -translate-y-1/2 mix-blend-screen" style={{ boxShadow: '0 0 20px 10px rgba(124, 58, 237, 0.4)' }}></div>
      <BackgroundBars step={step} domain={state.domain} />
      
      <AnimatePresence mode="wait">
        {step === 0 && <LandingScreen key="step0" onNext={nextStep} />}
        {step === 1 && <DomainSelection key="step1" onNext={nextStep} state={state} updateState={updateState} />}
        {step === 2 && <ResumeScan key="step2" onNext={nextStep} state={state} updateState={updateState} />}
        {step === 3 && <GithubScan key="step3" onNext={nextStep} state={state} updateState={updateState} />}
        {step === 4 && <PortfolioScan key="step4" onNext={nextStep} state={state} updateState={updateState} />}
        {step === 5 && <FinalEvaluation key="step5" onNext={nextStep} state={state} updateState={updateState} />}
        {step === 6 && <ScoreReveal key="step6" state={state} onRestart={restart} />}
      </AnimatePresence>
    </div>
  );
}

export default App;
