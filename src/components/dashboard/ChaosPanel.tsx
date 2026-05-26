import React from 'react';
import type { ChaosType, ChaosIncident } from '../../engine/types';
import { Flame, ShieldAlert, Cpu, Play, Pause, RotateCcw, AlertTriangle } from 'lucide-react';

interface ChaosPanelProps {
  activeIncidents: ChaosIncident[];
  onInjectChaos: (type: ChaosType) => void;
  onResolveChaos: (id: string) => void;
  onClearAllChaos: () => void;
  isAutonomous: boolean;
  onToggleAutonomous: () => void;
  isPaused: boolean;
  onTogglePlayPause: () => void;
}

interface ChaosOption {
  type: ChaosType;
  label: string;
  category: 'provider' | 'infrastructure' | 'orchestration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

const CHAOS_OPTIONS: ChaosOption[] = [
  {
    type: 'openai_outage',
    label: 'OpenAI Outage',
    category: 'provider',
    severity: 'critical',
    description: 'Brings OpenAI Gateway API Offline with 503 errors.',
  },
  {
    type: 'claude_timeout',
    label: 'Claude Timeout',
    category: 'provider',
    severity: 'high',
    description: 'Triggers 15-second response timeouts on Anthropic.',
  },
  {
    type: 'rate_limit_failure',
    label: 'Rate Limit (429)',
    category: 'provider',
    severity: 'high',
    description: 'Floods LLM API, triggering 429 Too Many Requests.',
  },
  {
    type: 'latency_spike',
    label: 'Latency Spike',
    category: 'provider',
    severity: 'medium',
    description: 'Adds 3000ms regional router lag to LLM endpoints.',
  },
  {
    type: 'vector_db_corruption',
    label: 'Vector DB Corruption',
    category: 'infrastructure',
    severity: 'critical',
    description: 'Corrupts vector query indexing segments.',
  },
  {
    type: 'mcp_server_crash',
    label: 'MCP Server Crash',
    category: 'infrastructure',
    severity: 'high',
    description: 'Terminates MCP tool-host process via segmentation fault.',
  },
  {
    type: 'token_spike',
    label: 'Token Volume Spike',
    category: 'orchestration',
    severity: 'medium',
    description: 'Injects context payloads exceeding 250k tokens.',
  },
  {
    type: 'retry_storm',
    label: 'Retry Storm',
    category: 'orchestration',
    severity: 'high',
    description: 'Launches unregulated aggressive agent retry loops.',
  },
  {
    type: 'memory_overflow',
    label: 'Gateway Memory leak',
    category: 'orchestration',
    severity: 'high',
    description: 'Gateway heap leaks, causing extreme garbage collection delays.',
  },
  {
    type: 'queue_congestion',
    label: 'Queue Congestion',
    category: 'orchestration',
    severity: 'medium',
    description: 'Saturates thread queues, blocking worker execution.',
  },
  {
    type: 'agent_deadlock',
    label: 'Agent Swarm Deadlock',
    category: 'orchestration',
    severity: 'high',
    description: 'Loops agent nodes into cyclical tool dependencies.',
  },
];

interface ChaosOptionButtonProps {
  opt: typeof CHAOS_OPTIONS[number];
  isActive: boolean;
  onInject: (type: ChaosType) => void;
  className?: string;
  getSeverityBadgeColor: (severity: string) => string;
}

const ChaosOptionButton: React.FC<ChaosOptionButtonProps> = ({
  opt,
  isActive,
  onInject,
  className = '',
  getSeverityBadgeColor,
}) => {
  return (
    <button
      onClick={() => onInject(opt.type)}
      disabled={isActive}
      className={`p-2 rounded-lg border text-left transition-all ${className} ${
        isActive
          ? 'bg-rose-950/20 border-rose-500 text-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-semibold">{opt.label}</span>
        <span className={`px-1 py-0.2 rounded text-[7px] font-mono border ${getSeverityBadgeColor(opt.severity)}`}>
          {opt.severity.toUpperCase()}
        </span>
      </div>
      <p className="text-[8px] font-mono text-slate-500 mt-1 leading-normal">
        {opt.description}
      </p>
    </button>
  );
};

export const ChaosPanel: React.FC<ChaosPanelProps> = ({
  activeIncidents,
  onInjectChaos,
  onResolveChaos,
  onClearAllChaos,
  isAutonomous,
  onToggleAutonomous,
  isPaused,
  onTogglePlayPause,
}) => {
  // Pre-configured Scenarios
  const triggerScenario = (scenario: 'blackout' | 'rag_cascade' | 'deadlock_storm') => {
    onClearAllChaos();
    setTimeout(() => {
      if (scenario === 'blackout') {
        onInjectChaos('openai_outage');
        setTimeout(() => onInjectChaos('claude_timeout'), 2000);
      } else if (scenario === 'rag_cascade') {
        onInjectChaos('vector_db_corruption');
        setTimeout(() => onInjectChaos('mcp_server_crash'), 1500);
        setTimeout(() => onInjectChaos('queue_congestion'), 3000);
      } else if (scenario === 'deadlock_storm') {
        onInjectChaos('agent_deadlock');
        setTimeout(() => onInjectChaos('retry_storm'), 2000);
        setTimeout(() => onInjectChaos('memory_overflow'), 4000);
      }
    }, 200);
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-rose-500 bg-rose-950/45 border-rose-900/60';
      case 'high':
        return 'text-amber-500 bg-amber-950/45 border-amber-900/60';
      default:
        return 'text-yellow-400 bg-yellow-950/30 border-yellow-900/40';
    }
  };

  return (
    <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col h-full shadow-lg">
      {/* Simulation Master Controller HUD */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
        <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider flex items-center">
          <Flame size={14} className="text-rose-500 mr-1.5 animate-pulse" />
          CHAOS ENGINEERING COCKPIT
        </h3>
        
        {/* Playback HUD controls */}
        <div className="flex items-center space-x-2">
          {/* Autonomous toggle indicator */}
          <button
            onClick={onToggleAutonomous}
            className={`px-2.5 py-1 rounded text-[10px] font-mono border tracking-wider transition-all duration-300 ${
              isAutonomous
                ? 'bg-cyan-950/60 border-cyan-500 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
            }`}
          >
            {isAutonomous ? 'AUTONOMOUS RECOVERY: ON' : 'AUTONOMOUS RECOVERY: OFF'}
          </button>

          <button
            onClick={onTogglePlayPause}
            className="p-1 rounded bg-slate-800/60 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>
          
          <button
            onClick={onClearAllChaos}
            className="p-1 rounded bg-slate-800/60 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Heal Systems / Resolve Outages"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Manual chaos injectors */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {/* Scenarios Section */}
        <div>
          <h4 className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
            <AlertTriangle size={12} className="text-amber-500 mr-1" />
            CASCADING CHAOS SCENARIOS
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => triggerScenario('blackout')}
              className="px-2 py-2 rounded-lg bg-slate-900/80 border border-rose-900/30 hover:border-rose-600 text-slate-300 hover:text-white transition-all text-left group"
            >
              <div className="text-[10px] font-mono font-bold text-rose-400">01. LLM Blackout</div>
              <div className="text-[8px] font-mono text-slate-500 mt-0.5 group-hover:text-slate-400">OpenAI + Claude API outages</div>
            </button>
            <button
              onClick={() => triggerScenario('rag_cascade')}
              className="px-2 py-2 rounded-lg bg-slate-900/80 border border-rose-900/30 hover:border-rose-600 text-slate-300 hover:text-white transition-all text-left group"
            >
              <div className="text-[10px] font-mono font-bold text-rose-400">02. RAG Collapse</div>
              <div className="text-[8px] font-mono text-slate-500 mt-0.5 group-hover:text-slate-400">VDB crash + Tool queue congestion</div>
            </button>
            <button
              onClick={() => triggerScenario('deadlock_storm')}
              className="px-2 py-2 rounded-lg bg-slate-900/80 border border-rose-900/30 hover:border-rose-600 text-slate-300 hover:text-white transition-all text-left group"
            >
              <div className="text-[10px] font-mono font-bold text-rose-400">03. Swarm Deadlock</div>
              <div className="text-[8px] font-mono text-slate-500 mt-0.5 group-hover:text-slate-400">Deadlocked ReAct loops + GC leak</div>
            </button>
          </div>
        </div>

        {/* Categories of manual failures */}
        <div>
          <h4 className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
            <Cpu size={12} className="text-cyan-400 mr-1" />
            MANUAL INJECTORS
          </h4>

          {/* Provider Failures */}
          <div className="mb-3">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Upstream Provider Layers</div>
            <div className="grid grid-cols-2 gap-2">
              {CHAOS_OPTIONS.filter((o) => o.category === 'provider').map((opt) => (
                <ChaosOptionButton
                  key={opt.type}
                  opt={opt}
                  isActive={activeIncidents.some((i) => i.type === opt.type)}
                  onInject={onInjectChaos}
                  getSeverityBadgeColor={getSeverityBadgeColor}
                />
              ))}
            </div>
          </div>

          {/* Infrastructure & Orchestration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Platform Infrastructure</div>
              <div className="space-y-2">
                {CHAOS_OPTIONS.filter((o) => o.category === 'infrastructure').map((opt) => (
                  <ChaosOptionButton
                    key={opt.type}
                    opt={opt}
                    isActive={activeIncidents.some((i) => i.type === opt.type)}
                    onInject={onInjectChaos}
                    className="w-full"
                    getSeverityBadgeColor={getSeverityBadgeColor}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Agent Orchestration & Queues</div>
              <div className="space-y-2">
                {CHAOS_OPTIONS.filter((o) => o.category === 'orchestration').map((opt) => (
                  <ChaosOptionButton
                    key={opt.type}
                    opt={opt}
                    isActive={activeIncidents.some((i) => i.type === opt.type)}
                    onInject={onInjectChaos}
                    className="w-full"
                    getSeverityBadgeColor={getSeverityBadgeColor}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Current Active Outages list */}
        {activeIncidents.length > 0 && (
          <div className="mt-4 border-t border-slate-800/80 pt-3">
            <h4 className="text-[9px] font-mono font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center">
              <ShieldAlert size={12} className="mr-1" />
              ACTIVE INCIDENT TELEMETRY ({activeIncidents.length})
            </h4>
            <div className="space-y-2">
              {activeIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between bg-rose-950/15 border border-rose-900/40 px-3 py-2 rounded-lg"
                >
                  <div>
                    <div className="text-[10px] font-mono font-bold text-slate-200">
                      {incident.description}
                    </div>
                    <div className="text-[8px] font-mono text-slate-500 mt-0.5">
                      Node ID: {incident.nodeId} | Severity: {incident.severity.toUpperCase()}
                    </div>
                  </div>
                  <button
                    onClick={() => onResolveChaos(incident.id)}
                    className="px-2 py-1 bg-rose-900/40 hover:bg-emerald-900/40 border border-rose-800/50 hover:border-emerald-800/50 text-rose-300 hover:text-emerald-300 text-[8px] font-mono rounded transition-colors"
                  >
                    RESOLVE
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ChaosPanel;
