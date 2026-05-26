import React, { useState, useRef, useEffect } from 'react';
import type { NodeState, ConnectionState, LogEntry, SystemMetrics, ActiveMitigation, ChaosIncident, ChaosType, SimulationSnapshot } from '../engine/types';
import { TopologyGraph } from './TopologyGraph';
import { MetricsPanel } from './MetricsPanel';
import { AlertStream } from './AlertStream';
import { ChaosPanel } from './ChaosPanel';
import { ReplayCenter } from './ReplayCenter';
import { AnalyticsPage } from './AnalyticsPage';
import type { RecoveryPlan } from '../engine/recoveryEngine';
import type { CascadePrediction } from '../engine/aiEngine';
import { Activity, ShieldAlert, RefreshCw, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  nodes: NodeState[];
  connections: ConnectionState[];
  logs: LogEntry[];
  metrics: SystemMetrics[];
  activeMitigations: ActiveMitigation[];
  activeChaosIncidents: ChaosIncident[];
  onInjectChaos: (type: ChaosType) => void;
  onResolveChaos: (id: string) => void;
  onClearAllChaos: () => void;
  isAutonomous: boolean;
  onToggleAutonomous: () => void;
  isPaused: boolean;
  onTogglePlayPause: () => void;

  onClearLogs: () => void;
  onAddMitigation: (mit: Omit<ActiveMitigation, 'id' | 'startedAt'>) => void;
  onRemoveMitigation: (id: string) => void;
  predictions: CascadePrediction[];
  recoveryPlans: RecoveryPlan[];
  isReplaying: boolean;
  replayIndex: number;
  onToggleReplayMode: (active: boolean) => void;
  onSetReplayIndex: (index: number) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onExit: () => void;
  snapshots: SimulationSnapshot[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  nodes,
  connections,
  logs,
  metrics,
  activeMitigations,
  activeChaosIncidents,
  onInjectChaos,
  onResolveChaos,
  onClearAllChaos,
  isAutonomous,
  onToggleAutonomous,
  isPaused,
  onTogglePlayPause,
  onClearLogs,
  onAddMitigation,
  onRemoveMitigation,
  predictions,
  recoveryPlans,
  isReplaying,
  replayIndex,
  onToggleReplayMode,
  onSetReplayIndex,
  onStepForward,
  onStepBackward,
  onExit,
  snapshots,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'sandbox' | 'analytics'>('console');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('agent_executor');
  
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'agent' | 'system';
    text: string;
    badge?: string;
    type?: 'success' | 'warning' | 'error' | 'info';
  }>>([
    {
      id: 'm1',
      sender: 'agent',
      text: 'Resilient Agent core online. TrueFoundry AI Gateway established. System operating in US-East-1.',
      badge: 'TrueFoundry Gateway: nominal',
      type: 'success',
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newMsgId = Math.random().toString(36).substring(2, 9);
    
    // Add user message
    setChatMessages((prev) => [
      ...prev,
      {
        id: newMsgId,
        sender: 'user',
        text: userText,
      }
    ]);
    setChatInput('');

    // Simulated latency delay response
    setTimeout(() => {
      const openai = nodes.find(n => n.id === 'openai_provider')!;
      const vectorDb = nodes.find(n => n.id === 'vector_db')!;
      const mcp = nodes.find(n => n.id === 'mcp_server')!;
      const openRouter = nodes.find(n => n.id === 'truefoundry_gateway')!;
      const agent = nodes.find(n => n.id === 'agent_executor')!;
      const isMitigated = (type: string, nodeId: string) => activeMitigations.some(m => m.type === type && m.nodeId === nodeId);

      const openaiDown = openai.status === 'critical' || openai.status === 'unstable';
      const failoverActive = isMitigated('failover', 'truefoundry_gateway');

      const vdbCorrupt = vectorDb.status === 'critical' || vectorDb.status === 'unstable';
      const circuitVdb = isMitigated('circuit_breaking', 'vector_db');
      const degradedAgent = isMitigated('degraded_mode', 'agent_executor');

      const mcpCrashed = mcp.status === 'critical';
      const agentDeadlocked = agent.status === 'critical' || agent.status === 'unstable';

      let reply = '';
      let badge = 'gpt-4o via TrueFoundry';
      let type: 'success' | 'warning' | 'error' | 'info' = 'success';

      if (agentDeadlocked) {
        reply = '❌ Error: ReAct Swarm Execution Engine has deadlocked due to cyclic loop (CPU 100%). Thread pool is exhausted.';
        badge = 'Agent Core: deadlocked';
        type = 'error';
      } else if (openaiDown && !failoverActive) {
        reply = '❌ HTTP 503 Service Unavailable: TrueFoundry AI Gateway reported all primary LLM upstream providers are offline. Request timed out after 10000ms.';
        badge = 'Gateway Error: timeout';
        type = 'error';
      } else if (openaiDown && failoverActive) {
        const activeModel = openRouter.activeModel === 'claude-3-5-sonnet' ? 'Claude 3.5 Sonnet' : 'Local Llama-3';
        reply = `Hello! I received your query: "${userText}". I have successfully processed this request. (Note: OpenAI is currently offline; TrueFoundry's AI Gateway automatically failed over to ${activeModel} to keep this conversation active).`;
        badge = `Failover: ${activeModel}`;
        type = 'warning';
      } else if (vdbCorrupt && !circuitVdb && !degradedAgent) {
        reply = '❌ ConnectionTimeout: Agent Core thread pool starved waiting for Vector DB queries. Retrying... (Storm load detected).';
        badge = 'Agent Crash: VectorDB lock';
        type = 'error';
      } else if (vdbCorrupt && (circuitVdb || degradedAgent)) {
        reply = `Hello! I received your query: "${userText}". I have answered it using cached metadata. (Note: Pinecone Vector DB index is corrupt. Our circuit breaker is open to prevent agent stalling, meaning semantic search is offline, and I am operating in Degraded Mode).`;
        badge = 'Degraded: Vector DB bypassed';
        type = 'info';
      } else if (mcpCrashed && !degradedAgent) {
        reply = '❌ MCP Server Exception: Tool Executor process exited unexpectedly with SIGSEGV. Swarm tool execution stalled.';
        badge = 'Agent Exception: MCP crash';
        type = 'error';
      } else if (mcpCrashed && degradedAgent) {
        reply = `Hello! I received your query: "${userText}". I have processed it without external tools. (Note: The local MCP server has crashed. I have fallen back to Degraded Mode, using static internal functions instead of external code tools).`;
        badge = 'Degraded: MCP bypassed';
        type = 'info';
      } else {
        reply = `Hello! I received your query: "${userText}". I have successfully completed the ReAct agent cycle and fetched relevant context via Pinecone Vector DB.`;
        badge = 'gpt-4o via TrueFoundry Gateway';
        type = 'success';
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'agent',
          text: reply,
          badge,
          type,
        }
      ]);
    }, 600);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const currentMetrics = metrics[metrics.length - 1] || {};

  const handleApplyPlan = (plan: RecoveryPlan) => {
    onAddMitigation({
      name: plan.name,
      nodeId: plan.targetNodeId,
      type: plan.type,
      description: plan.description,
      impactSummary: plan.expectedOutcome,
    });
  };

  const getStatusColorClass = (status: NodeState['status']) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400';
      case 'unstable': return 'text-amber-400';
      case 'critical': return 'text-rose-500 animate-pulse';
      case 'recovering': return 'text-cyan-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans select-none">
      {/* HUD Header Bar */}
      <header className="bg-[#090d16]/95 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 cursor-pointer" onClick={onExit}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono font-bold tracking-widest text-white">
                FAILOVER<span className="text-cyan-400">OS</span>
              </span>
              <span className="text-[9px] font-mono border border-slate-800 text-slate-500 px-1.5 py-0.2 rounded-md uppercase">
                Kernel console
              </span>
            </div>
            <p className="text-[9.5px] font-mono text-slate-500 mt-0.5">
              Infrastructure Self-Healing System Active • Dynamic Routing Target: us-east-1
            </p>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center bg-slate-950 border border-slate-850 px-1 py-1 rounded-lg">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-4 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
              activeTab === 'console'
                ? 'bg-slate-800/80 text-cyan-400 font-bold border-b border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mission Operations
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
              activeTab === 'sandbox'
                ? 'bg-slate-800/80 text-cyan-400 font-bold border-b border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SLA Resilience Sandbox
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
              activeTab === 'analytics'
                ? 'bg-slate-800/80 text-cyan-400 font-bold border-b border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resilience Scorecard
          </button>
        </div>

        {/* Status Hub Indicator */}
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-[9px] font-mono text-slate-500 uppercase">Resilience Index</div>
            <div className="text-sm font-mono font-bold text-cyan-400">{currentMetrics.overallResilienceScore}%</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-mono text-slate-500 uppercase">Avg Latency</div>
            <div className="text-sm font-mono font-bold text-emerald-400">{currentMetrics.averageLatency}ms</div>
          </div>
          <button
            onClick={onExit}
            className="px-3 py-1 rounded border border-slate-800 hover:border-rose-500/50 hover:text-rose-400 text-[9px] font-mono text-slate-400 transition-colors"
          >
            EXIT SESSION
          </button>
        </div>
      </header>

      {/* Main dashboard columns */}
      <div className="flex-1 max-w-7xl mx-auto px-6 py-6 w-full space-y-6">
        {/* Core sparklines always on top */}
        <MetricsPanel metrics={currentMetrics as SystemMetrics} history={metrics} />

        {activeTab === 'console' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Middle Column (Graph & Playback Scrubber & Live Log stream) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Topology SVG map */}
              <div className="relative">
                <div className="absolute top-3 left-4 z-20 flex items-center space-x-2">
                  <Activity size={14} className="text-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-slate-200 tracking-wider">
                    INTERACTIVE AGENT TOPOLOGY GRAPH
                  </span>
                </div>
                <TopologyGraph
                  nodes={nodes}
                  connections={connections}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                />
              </div>

              {/* Scrubber replay */}
              <ReplayCenter
                snapshots={snapshots}
                isReplaying={isReplaying}
                replayIndex={replayIndex}
                onToggleReplayMode={onToggleReplayMode}
                onSetReplayIndex={onSetReplayIndex}
                onStepForward={onStepForward}
                onStepBackward={onStepBackward}
              />

              {/* Live telemetry console alert stream */}
              <AlertStream logs={logs} onClearLogs={onClearLogs} />
            </div>

            {/* Right Column Sidebar (Node details & AI Predictions & Controls) */}
            <div className="space-y-6">
              {/* 1. Selected Node HUD */}
              {selectedNode ? (
                <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 shadow-lg">
                  <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider border-b border-slate-800/60 pb-3 mb-3 flex items-center justify-between">
                    <span>NODE METRICS MONITOR</span>
                    <span className={`text-[9px] uppercase font-bold ${getStatusColorClass(selectedNode.status)}`}>
                      [{selectedNode.status}]
                    </span>
                  </h3>

                  <div className="space-y-3 font-mono text-[10.5px]">
                    <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-900">
                      <span className="text-slate-500">Node Identifier:</span>
                      <span className="text-slate-300 font-bold">{selectedNode.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-950/40 p-2 rounded border border-slate-900">
                        <div className="text-[9px] text-slate-500 uppercase">Throughput</div>
                        <div className="text-xs font-bold text-white mt-1">
                          {Math.round(selectedNode.throughput)} RPS
                        </div>
                      </div>
                      <div className="bg-slate-950/40 p-2 rounded border border-slate-900">
                        <div className="text-[9px] text-slate-500 uppercase">Node Latency</div>
                        <div className="text-xs font-bold text-white mt-1">
                          {selectedNode.latency}ms
                        </div>
                      </div>
                    </div>

                    {/* Progress bars for loads */}
                    <div className="space-y-2.5 mt-2 bg-slate-950/20 p-2.5 rounded border border-slate-850/60">
                      {/* CPU */}
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                          <span>CPU Core Load:</span>
                          <span className="text-slate-300">{selectedNode.cpuUsage}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              selectedNode.cpuUsage > 85 ? 'bg-rose-500' : selectedNode.cpuUsage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${selectedNode.cpuUsage}%` }}
                          />
                        </div>
                      </div>

                      {/* Memory */}
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                          <span>Memory Usage:</span>
                          <span className="text-slate-300">{selectedNode.memoryUsage}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              selectedNode.memoryUsage > 85 ? 'bg-rose-500' : selectedNode.memoryUsage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${selectedNode.memoryUsage}%` }}
                          />
                        </div>
                      </div>

                      {/* Queue */}
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                          <span>Queue Saturation:</span>
                          <span className="text-slate-300">
                            {selectedNode.queueDepth}/{selectedNode.maxQueueDepth}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 transition-all duration-500"
                            style={{ width: `${(selectedNode.queueDepth / selectedNode.maxQueueDepth) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cost / region tags */}
                    <div className="flex justify-between items-center text-[9px] text-slate-500 mt-2">
                      <span>Regional zone: <span className="text-slate-400 font-bold">{selectedNode.region}</span></span>
                      {selectedNode.cost > 0 && (
                        <span>Cost context: <span className="text-slate-400 font-bold">${selectedNode.cost.toFixed(3)}/1k</span></span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex items-center justify-center h-[180px] shadow-lg">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    Select a node in the graph map
                  </span>
                </div>
              )}

              {/* 2. AI Recommendation & Cascade Warnings Panel */}
              <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 shadow-lg space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider border-b border-slate-800/60 pb-3 flex items-center justify-between">
                  <span className="flex items-center">
                    <RefreshCw size={12} className="text-cyan-400 mr-1.5 animate-spin-slow" />
                    AI AUTONOMOUS ROUTER & ADVISOR
                  </span>
                </h3>

                {/* Anomalies/Cascade Predictions summary */}
                {predictions.length > 0 && (
                  <div className="bg-rose-950/20 border border-rose-800/40 p-2.5 rounded-lg space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-rose-400 flex items-center">
                      <ShieldAlert size={12} className="mr-1 animate-pulse" />
                      CASCADING FAILURE RISK WARNING
                    </div>
                    {predictions.map((p, idx) => (
                      <p key={idx} className="text-[8.5px] font-mono text-slate-300 leading-normal">
                        ➜ <span className="text-rose-400 font-bold">Node [{nodes.find((n) => n.id === p.nodeId)?.name}]</span> has a{' '}
                        <span className="text-rose-400 font-bold">{Math.round(p.probability * 100)}% risk</span> of crash in {p.timeToOutageSeconds}s due to: {p.reason}
                      </p>
                    ))}
                  </div>
                )}

                {/* AI Mitigations Plans checklist */}
                <div className="space-y-2">
                  <div className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider">
                    PROPOSED POLICY MITIGATIONS
                  </div>

                  {recoveryPlans.length === 0 ? (
                    <div className="text-[9px] font-mono text-slate-500 italic p-2 bg-slate-950/40 rounded border border-slate-900/60">
                      All systems operating nominal. No mitigation schedules queued.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {recoveryPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-lg text-[9.5px] font-mono space-y-2 hover:border-slate-750 transition-colors"
                        >
                          <div>
                            <div className="flex justify-between items-center text-slate-200 font-bold">
                              <span>{plan.name}</span>
                              <span className="text-[7.5px] text-cyan-400 uppercase border border-cyan-900/60 px-1 py-0.2 rounded bg-cyan-950/20">
                                {plan.estimatedRecoverySpeed}
                              </span>
                            </div>
                            <p className="text-[8.5px] text-slate-400 mt-1 leading-normal">
                              {plan.description}
                            </p>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-900 pt-2 mt-1">
                            <span className="text-[8px] text-slate-500">Cost: {plan.costImpact.toUpperCase()}</span>
                            {!isAutonomous && (
                              <button
                                onClick={() => handleApplyPlan(plan)}
                                className="px-2 py-0.5 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800 text-cyan-400 text-[8px] font-bold rounded tracking-wider uppercase transition-colors"
                              >
                                Apply Policy
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Mitigations list */}
                {activeMitigations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="text-[9.5px] font-mono text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                      <span>ACTIVE RESILIENCE POLICIES</span>
                      <ShieldCheck size={11} />
                    </div>
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                      {activeMitigations.map((mit) => (
                        <div
                          key={mit.id}
                          className="flex items-center justify-between bg-emerald-950/15 border border-emerald-900/40 p-2 rounded text-[9px] font-mono"
                        >
                          <div>
                            <div className="font-bold text-slate-200">{mit.name}</div>
                            <div className="text-[7.5px] text-slate-500">{mit.impactSummary}</div>
                          </div>
                          <button
                            onClick={() => onRemoveMitigation(mit.id)}
                            className="px-1.5 py-0.5 bg-transparent hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 text-slate-400 hover:text-rose-400 text-[7.5px] rounded transition-colors"
                          >
                            RETIRE
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Chaos Panel manual triggers embedded here */}
              <ChaosPanel
                activeIncidents={activeChaosIncidents}
                onInjectChaos={onInjectChaos}
                onResolveChaos={onResolveChaos}
                onClearAllChaos={onClearAllChaos}
                isAutonomous={isAutonomous}
                onToggleAutonomous={onToggleAutonomous}
                isPaused={isPaused}
                onTogglePlayPause={onTogglePlayPause}
              />
            </div>
          </div>
        ) : activeTab === 'sandbox' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Chat Sandbox */}
            <div className="lg:col-span-2 flex flex-col bg-[#090d16]/90 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg h-[650px]">
              {/* Sandbox Header */}
              <div className="bg-slate-950/60 border-b border-slate-800/60 px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider uppercase">
                      SLA Graceful Degradation Sandbox
                    </h3>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    Interact with the agent swarm. Inject chaos in the right panel to test resilience.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    Active Gateway Route: <span className="text-cyan-400 font-bold">
                      {nodes.find(n => n.id === 'truefoundry_gateway')?.activeModel || 'gpt-4o'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Status HUD of the Agent Swarm for immediate visual feedback of degradation */}
              <div className="bg-slate-950/20 border-b border-slate-900 px-5 py-2.5 grid grid-cols-3 gap-4 text-[9px] font-mono">
                <div className="flex items-center justify-between bg-slate-900/40 p-1.5 rounded border border-slate-900">
                  <span className="text-slate-500">LLM Provider:</span>
                  {activeMitigations.some(m => m.type === 'failover') ? (
                    <span className="text-amber-400 font-bold uppercase animate-pulse">[Failover Active]</span>
                  ) : nodes.find(n => n.id === 'openai_provider')?.status === 'critical' ? (
                    <span className="text-rose-500 font-bold uppercase">[Offline]</span>
                  ) : (
                    <span className="text-emerald-400 font-bold uppercase">[Nominal]</span>
                  )}
                </div>
                <div className="flex items-center justify-between bg-slate-900/40 p-1.5 rounded border border-slate-900">
                  <span className="text-slate-500">Vector Search:</span>
                  {activeMitigations.some(m => m.type === 'circuit_breaking') ? (
                    <span className="text-amber-400 font-bold uppercase animate-pulse">[CB Open: Bypassed]</span>
                  ) : nodes.find(n => n.id === 'vector_db')?.status === 'critical' ? (
                    <span className="text-rose-500 font-bold uppercase">[Stalled]</span>
                  ) : (
                    <span className="text-emerald-400 font-bold uppercase">[Nominal]</span>
                  )}
                </div>
                <div className="flex items-center justify-between bg-slate-900/40 p-1.5 rounded border border-slate-900">
                  <span className="text-slate-500">MCP Tool server:</span>
                  {activeMitigations.some(m => m.type === 'degraded_mode' && m.nodeId === 'agent_executor') ? (
                    <span className="text-amber-400 font-bold uppercase animate-pulse">[Degraded: Swarm]</span>
                  ) : nodes.find(n => n.id === 'mcp_server')?.status === 'critical' ? (
                    <span className="text-rose-500 font-bold uppercase">[Unavailable]</span>
                  ) : (
                    <span className="text-emerald-400 font-bold uppercase">[Nominal]</span>
                  )}
                </div>
              </div>

              {/* Chat Messages Panel */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/10">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : msg.sender === 'system' ? 'items-center' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span className="text-[8px] font-mono text-slate-500 uppercase">
                        {msg.sender === 'user' ? 'Operator' : msg.sender === 'system' ? 'Kernel Alert' : 'Autonomous Resilient Agent'}
                      </span>
                      {msg.badge && (
                        <span
                          className={`text-[8px] font-mono px-1.5 py-0.2 rounded border ${
                            msg.type === 'success'
                              ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-400'
                              : msg.type === 'warning'
                              ? 'bg-amber-950/30 border-amber-900/60 text-amber-400'
                              : msg.type === 'error'
                              ? 'bg-rose-950/30 border-rose-900/60 text-rose-400'
                              : 'bg-cyan-950/30 border-cyan-900/60 text-cyan-400'
                          }`}
                        >
                          {msg.badge}
                        </span>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-lg p-3 text-xs font-mono leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-cyan-950/30 border border-cyan-800/40 text-cyan-200'
                          : msg.sender === 'system'
                          ? 'bg-slate-900/80 border border-slate-800 text-slate-400 text-center italic'
                          : msg.type === 'error'
                          ? 'bg-rose-950/20 border border-rose-900/40 text-rose-200'
                          : msg.type === 'warning'
                          ? 'bg-amber-950/20 border border-amber-900/40 text-amber-200'
                          : msg.type === 'info'
                          ? 'bg-cyan-950/10 border border-cyan-900/30 text-cyan-200'
                          : 'bg-slate-900/50 border border-slate-800 text-slate-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions Chips */}
              <div className="bg-slate-950/30 border-t border-slate-900/80 px-5 py-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setChatInput("Search vector DB index for user sessions")}
                  className="text-[9px] font-mono bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700 px-2.5 py-1 rounded transition-colors"
                >
                  🔍 Query Vector DB
                </button>
                <button
                  type="button"
                  onClick={() => setChatInput("Execute system diagnostics tool on MCP server")}
                  className="text-[9px] font-mono bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700 px-2.5 py-1 rounded transition-colors"
                >
                  🛠️ Run MCP Tool
                </button>
                <button
                  type="button"
                  onClick={() => setChatInput("What is the system uptime policy details?")}
                  className="text-[9px] font-mono bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700 px-2.5 py-1 rounded transition-colors"
                >
                  🤖 LLM Query
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendChatMessage} className="bg-slate-950 border-t border-slate-800/80 p-4 flex items-center space-x-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type an instruction for the agent..."
                  className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-750 focus:border-cyan-500/50 text-xs font-mono px-4 py-2.5 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="bg-cyan-950/60 hover:bg-cyan-900/50 border border-cyan-800/80 text-cyan-400 font-mono text-[10px] font-bold px-4 py-2.5 rounded-lg uppercase tracking-wider transition-colors"
                >
                  Send
                </button>
              </form>
            </div>

            {/* Right Column: Embedded Chaos Trigger Deck */}
            <div className="space-y-6">
              {/* Active mitigations indicator */}
              <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 shadow-lg space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider border-b border-slate-800/60 pb-3 flex items-center justify-between">
                  <span>RESILIENCE FEEDBACK CONTROL</span>
                  <span className="text-[8.5px] uppercase font-bold text-cyan-400">
                    [Active Policies: {activeMitigations.length}]
                  </span>
                </h3>

                {activeMitigations.length === 0 ? (
                  <div className="text-[9px] font-mono text-slate-500 italic p-3 bg-slate-950/40 rounded border border-slate-900/60 text-center">
                    Autonomous self-healing is passive. No active mitigating overrides.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeMitigations.map((mit) => (
                      <div
                        key={mit.id}
                        className="bg-emerald-950/15 border border-emerald-900/40 p-2.5 rounded-lg text-[9px] font-mono flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-200 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                            {mit.name}
                          </div>
                          <div className="text-[7.5px] text-slate-400 mt-0.5">{mit.impactSummary}</div>
                        </div>
                        <button
                          onClick={() => onRemoveMitigation(mit.id)}
                          className="px-1.5 py-0.5 bg-transparent hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 text-slate-400 hover:text-rose-400 text-[7.5px] rounded transition-colors"
                        >
                          BYPASS
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ChaosPanel triggers */}
              <ChaosPanel
                activeIncidents={activeChaosIncidents}
                onInjectChaos={onInjectChaos}
                onResolveChaos={onResolveChaos}
                onClearAllChaos={onClearAllChaos}
                isAutonomous={isAutonomous}
                onToggleAutonomous={onToggleAutonomous}
                isPaused={isPaused}
                onTogglePlayPause={onTogglePlayPause}
              />
            </div>
          </div>
        ) : (
          <AnalyticsPage history={snapshots} />
        )}
      </div>

      {/* Cyber Operations HUD Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 px-6 py-4 text-center mt-auto">
        <p className="text-[9px] font-mono text-slate-500 tracking-wider flex items-center justify-center">
          FAILOVER_OS RESILIENCE KERNEL • COMPILED WITH VITE + REACT + TAILWIND V4 • SECURE DEPLOYMENT TARGET ONLINE
        </p>
      </footer>
    </div>
  );
};
export default Dashboard;
