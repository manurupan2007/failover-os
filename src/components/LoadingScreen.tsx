import React, { useEffect, useState } from 'react';
import { Terminal, Shield, Cpu, Network, Zap } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { text: 'INIT RESILIENCE_KERNEL v1.0.4-RELEASE...', icon: <Cpu className="text-cyan-400" size={14} /> },
    { text: 'ALLOCATING MEMORY BLOCKS & CORRELATION VECTOR CHAINS...', icon: <Network className="text-emerald-400" size={14} /> },
    { text: 'SPAWNING AUTONOMOUS MITIGATION DAEMONS...', icon: <Shield className="text-purple-400" size={14} /> },
    { text: 'ESTABLISHING TRUEFOUNDRY GATEWAY LOGGING HOOKS...', icon: <Zap className="text-yellow-400" size={14} /> },
    { text: 'INITIALIZATION COMPLETE. MOUNTING TELEMETRY HUD...', icon: <Terminal className="text-green-400" size={14} /> },
  ];

  useEffect(() => {
    // Progress counter timer
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const diff = Math.floor(Math.random() * 8) + 4; // increment randomly
        return Math.min(prev + diff, 100);
      });
    }, 80);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    // Dynamic step highlights based on progress threshold
    if (progress < 20) setActiveStep(0);
    else if (progress < 45) setActiveStep(1);
    else if (progress < 70) setActiveStep(2);
    else if (progress < 90) setActiveStep(3);
    else setActiveStep(4);

    if (progress === 100) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 400); // short delay after hitting 100% for smooth exit
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center p-6 z-50 overflow-hidden font-mono select-none">
      {/* Retroglow Scanlines overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0)_95%,rgba(6,182,212,0.03)_95%)] bg-[size:100%_15px] pointer-events-none" />
      
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#090d16_1px,transparent_1px),linear-gradient(to_bottom,#090d16_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none" />

      {/* Glow aura */}
      <div className="absolute w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />

      <div className="w-full max-w-xl bg-[#070b13] border border-slate-800/80 rounded-xl p-6 shadow-2xl relative">
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center">
            <Terminal size={12} className="mr-1 text-cyan-500 animate-pulse" />
            FAILOVER_OS BOOTLOADER
          </div>
        </div>

        {/* Loading Terminal stdout */}
        <div className="space-y-3 min-h-[160px]">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeStep;
            const isActive = idx === activeStep;
            
            return (
              <div
                key={idx}
                className={`flex items-start space-x-3 text-[10.5px] transition-all duration-300 ${
                  isCompleted 
                    ? 'text-slate-400' 
                    : isActive 
                    ? 'text-cyan-300 font-bold scale-[1.01]' 
                    : 'text-slate-600 opacity-30'
                }`}
              >
                <div className={`mt-0.5 transition-transform ${isActive ? 'animate-bounce' : ''}`}>
                  {step.icon}
                </div>
                <div className="flex-1 leading-relaxed">
                  <span className="mr-2 text-slate-600">[{idx + 1}]</span>
                  {step.text}
                </div>
                {isCompleted && (
                  <span className="text-emerald-400 font-bold text-[9px] border border-emerald-500/20 px-1 rounded bg-emerald-950/20">
                    OK
                  </span>
                )}
                {isActive && (
                  <span className="text-cyan-400 font-bold text-[9px] border border-cyan-500/20 px-1 rounded bg-cyan-950/20 animate-pulse">
                    LOAD
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* HUD Progress Bar */}
        <div className="mt-8 pt-4 border-t border-slate-800/60">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">COMPILE SYSTEM MODULES</span>
            <span className="text-xs text-cyan-400 font-bold tracking-wider">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 transition-all duration-100 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Floating telemetry bits */}
      <div className="absolute bottom-6 left-6 text-[8px] text-slate-600 select-none pointer-events-none">
        KERN.LOG: SYS_OK // VECTORS_OK // GATEWAY_LINK_STABLE
      </div>
      <div className="absolute bottom-6 right-6 text-[8px] text-slate-600 select-none pointer-events-none">
        FAILOVEROS MEMORY OVERLAY INJECT_INIT
      </div>
    </div>
  );
};
