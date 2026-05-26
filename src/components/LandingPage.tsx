import React from 'react';
import { Shield, ArrowRight, Zap, RefreshCw, Terminal, Cpu, Layers, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden font-sans">
      {/* Subtle background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Faint grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Shield size={16} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            Failover<span className="text-cyan-400">OS</span>
          </span>
        </div>

        <button
          onClick={onLaunch}
          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
        >
          <span>Open Dashboard</span>
          <ChevronRight size={14} />
        </button>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-24">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-900/40 text-cyan-400 text-xs mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Built for the TrueFoundry Resilient Agents Challenge</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Self-healing resilience
            <br />
            <span className="text-cyan-400">for AI infrastructure</span>
          </h1>

          <p className="mt-5 text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
            Simulate cascading failures across LLM providers, vector databases, and MCP tool servers. Watch autonomous recovery policies restore service in real-time.
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onLaunch}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors group"
            >
              <span>Launch Dashboard</span>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <span className="text-sm text-slate-500">
              Zero config · runs locally · Vite + React + TypeScript
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-20">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 hover:border-slate-700/80 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
              <Zap size={16} />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1.5">
              Live Topology Graph
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Interactive SVG map of your agent architecture. Watch request particles flow between nodes, see health status change in real-time.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 hover:border-slate-700/80 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <RefreshCw size={16} />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1.5">
              Autonomous Recovery
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              TrueFoundry AI Gateway routes across OpenAI, Claude, and Llama. Circuit breakers, context compression, and degraded fallbacks activate automatically.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 hover:border-slate-700/80 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Terminal size={16} />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1.5">
              SLA Degradation Sandbox
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Chat with the agent while injecting chaos. See how responses gracefully degrade, failover to backup models, or surface clear error states.
            </p>
          </div>
        </div>

        {/* Architecture diagram */}
        <div className="mt-16 border border-slate-800/60 bg-slate-900/20 rounded-xl p-6 max-w-3xl">
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3 mb-5">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            </div>
            <span className="text-xs text-slate-500">
              Resilience Pipeline
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            <div className="border border-slate-800/60 bg-slate-950/60 rounded-lg p-3 flex flex-col items-center text-center">
              <Cpu size={18} className="text-cyan-400 mb-1.5" />
              <span className="text-xs font-medium text-slate-200">Telemetry</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Metrics & logs</span>
            </div>

            <div className="hidden md:flex items-center justify-center text-slate-700">→</div>

            <div className="border border-slate-800/60 bg-slate-950/60 rounded-lg p-3 flex flex-col items-center text-center">
              <Layers size={18} className="text-purple-400 mb-1.5" />
              <span className="text-xs font-medium text-slate-200">Prediction</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Cascade analysis</span>
            </div>

            <div className="hidden md:flex items-center justify-center text-slate-700">→</div>

            <div className="border border-slate-800/60 bg-slate-950/60 rounded-lg p-3 flex flex-col items-center text-center">
              <Shield size={18} className="text-emerald-400 mb-1.5" />
              <span className="text-xs font-medium text-slate-200">Recovery</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Auto-mitigation</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default LandingPage;
