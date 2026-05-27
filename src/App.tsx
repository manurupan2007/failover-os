import { useState, useEffect, useRef } from 'react';
import { SimulationEngine } from './engine/simulationEngine';
import { AIEngine } from './engine/aiEngine';
import type { CascadePrediction } from './engine/aiEngine';
import { RecoveryEngine } from './engine/recoveryEngine';
import type { RecoveryPlan } from './engine/recoveryEngine';
import { ReplaySystem } from './engine/replaySystem';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { LoadingScreen } from './components/common/LoadingScreen';
import type {
  NodeState,
  ConnectionState,
  LogEntry,
  SystemMetrics,
  ActiveMitigation,
  ChaosIncident,
  ChaosType,
  SimulationSnapshot,
} from './engine/types';

export function App() {
  const [screen, setScreen] = useState<'landing' | 'loading' | 'dashboard'>('landing');

  // Engines references (persistent across renders)
  const simEngineRef = useRef<SimulationEngine | null>(null);
  const aiEngineRef = useRef<AIEngine | null>(null);
  const recoveryEngineRef = useRef<RecoveryEngine | null>(null);
  const replaySystemRef = useRef<ReplaySystem | null>(null);

  // States mirroring engine values for UI rendering
  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [connections, setConnections] = useState<ConnectionState[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [activeMitigations, setActiveMitigations] = useState<ActiveMitigation[]>([]);
  const [activeChaosIncidents, setActiveChaosIncidents] = useState<ChaosIncident[]>([]);

  // Simulation controls
  const [isAutonomous, setIsAutonomous] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);


  // Replay states
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(-1);
  const [snapshots, setSnapshots] = useState<SimulationSnapshot[]>([]);

  // AI Outputs states
  const [predictions, setPredictions] = useState<CascadePrediction[]>([]);
  const [recoveryPlans, setRecoveryPlans] = useState<RecoveryPlan[]>([]);

  // Cinematic AI Decision Feed & Demo Mode States
  const [aiDecisionLogs, setAiDecisionLogs] = useState<LogEntry[]>([]);
  const [demoActive, setDemoActive] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(0);

  // Initialize engines on mount
  useEffect(() => {
    simEngineRef.current = new SimulationEngine();
    aiEngineRef.current = new AIEngine();
    recoveryEngineRef.current = new RecoveryEngine();
    replaySystemRef.current = new ReplaySystem();

    // Populate initial state
    const snap = simEngineRef.current.getSnapshot();
    setNodes(snap.nodes);
    setConnections(snap.connections);
    setLogs(snap.logs);
    setMetrics([snap.metrics]);
    setActiveMitigations(snap.activeMitigations);
    setActiveChaosIncidents(snap.activeChaosIncidents);
    replaySystemRef.current.recordSnapshot(snap);
    setSnapshots([snap]);
    setAiDecisionLogs([
      {
        id: 'aidec_init',
        timestamp: 0,
        realTimestamp: snap.logs[0]?.realTimestamp || '00:00:00',
        type: 'success',
        source: 'ai_predictor',
        message: '[Observability Agent] Cognitive system online. Ready for SRE telemetry evaluation.',
      }
    ]);
  }, []);

  // Main simulation tick loop
  useEffect(() => {
    if (screen !== 'dashboard' || isPaused || isReplaying) return;

    const intervalTime = 1000;

    const tick = () => {
      const engine = simEngineRef.current;
      const ai = aiEngineRef.current;
      const recovery = recoveryEngineRef.current;
      const replay = replaySystemRef.current;

      if (!engine || !ai || !recovery || !replay) return;

      // Define AI optimized routing logic mapping
      const aiRoutingHook = (sim: SimulationEngine) => {
        const optimized = ai.getOptimizedRouting(sim.getNodes());
        const openRouter = sim.getNodes().find((n) => n.id === 'truefoundry_gateway');
        
        if (openRouter) {
          openRouter.activeModel = optimized.bestModel;
        }

        const connOpenai = sim.getConnections().find(
          (c) => c.source === 'truefoundry_gateway' && c.target === 'openai_provider'
        )!;
        const connAnthropic = sim.getConnections().find(
          (c) => c.source === 'truefoundry_gateway' && c.target === 'anthropic_provider'
        )!;
        const connLlama = sim.getConnections().find(
          (c) => c.source === 'truefoundry_gateway' && c.target === 'local_llama_provider'
        )!;

        // Reset
        connOpenai.load = 0;
        connAnthropic.load = 0;
        connLlama.load = 0;

        const rps = openRouter ? openRouter.throughput : 0;
        if (optimized.bestModel === 'gpt-4o') {
          const openai = sim.getNodes().find((n) => n.id === 'openai_provider')!;
          openai.throughput = rps;
          connOpenai.load = rps;
          connOpenai.status =
            openai.status === 'critical' || openai.status === 'unstable'
              ? 'congested'
              : 'active';
        } else if (optimized.bestModel === 'claude-3-5-sonnet') {
          const anthropic = sim.getNodes().find((n) => n.id === 'anthropic_provider')!;
          anthropic.throughput = rps;
          connAnthropic.load = rps;
          connAnthropic.status =
            anthropic.status === 'critical' || anthropic.status === 'unstable'
              ? 'congested'
              : 'active';
        } else if (optimized.bestModel === 'llama-3-8b-instruct') {
          const local = sim.getNodes().find((n) => n.id === 'local_llama_provider')!;
          local.throughput = rps;
          connLlama.load = rps;
          connLlama.status =
            local.status === 'critical' || local.status === 'unstable'
              ? 'congested'
              : 'active';
        }
      };

      // Perform tick
      const snapshot = engine.tick(aiRoutingHook);

      // AI Analysis
      ai.updateHistory(snapshot);
      const aiAnalysis = ai.analyze(snapshot.nodes, snapshot.connections);
      
      // Recovery Planning
      const plans = recovery.generateRecoveryPlan(
        snapshot.nodes,
        aiAnalysis.anomalies,
        aiAnalysis.predictions,
        snapshot.activeChaosIncidents,
        snapshot.activeMitigations
      );
      // Apply mitigations automatically if in Autonomous Mode and not in demo mode
      if (isAutonomous && plans.length > 0 && !demoActive) {
        const currentMitigations = engine.getActiveMitigations();
        
        plans.forEach((plan) => {
          // Only add if this type+node combination is not already applied
          const alreadyApplied = currentMitigations.some(
            (m) => m.type === plan.type && m.nodeId === plan.targetNodeId
          );
          if (!alreadyApplied) {
            engine.addMitigation({
              name: plan.name,
              nodeId: plan.targetNodeId,
              type: plan.type,
              description: plan.description,
              impactSummary: plan.expectedOutcome,
            });
          }
        });
        
        // Refresh plans after immediate application
        const updatedSnapshot = engine.getSnapshot();
        const rePlans = recovery.generateRecoveryPlan(
          updatedSnapshot.nodes,
          aiAnalysis.anomalies,
          aiAnalysis.predictions,
          updatedSnapshot.activeChaosIncidents,
          updatedSnapshot.activeMitigations
        );
        setRecoveryPlans(rePlans);
      } else {
        setRecoveryPlans(plans);
      }

      // Capture snapshot in replay system
      const finalSnapshot = engine.getSnapshot();
      replay.recordSnapshot(finalSnapshot);
      setSnapshots([...replay.getSnapshots()]);

      // If demo mode is active, handle sequencer
      if (demoActive) {
        setDemoStep((prevStep) => {
          const nextStep = prevStep + 1;
          
          if (nextStep === 3) {
            engine.injectChaos('regional_outage');
          } else if (nextStep === 6) {
            setAiDecisionLogs((prev) => [
              ...prev,
              {
                id: `aidec_demo_step_${nextStep}`,
                timestamp: engine.getRelativeTime(),
                realTimestamp: new Date().toLocaleTimeString().split(' ')[0],
                type: 'error',
                source: 'ai_predictor',
                message: '[Anomaly Detector] WARNING: BGP link failure detected in US-East-1. All regional paths failing. SLA breach probability: 99%.',
              }
            ]);
          } else if (nextStep === 9) {
            engine.addMitigation({
              name: 'Dynamic Load Rebalancing',
              nodeId: 'api_gateway',
              type: 'load_rebalancing',
              description: 'Rebalance request loads across us-west-2 mirror regions.',
              impactSummary: 'Bypasses blacked out us-east-1 gateways, routing to us-west-2 local Llama-3 nodes.',
            });
          } else if (nextStep === 12) {
            setAiDecisionLogs((prev) => [
              ...prev,
              {
                id: `aidec_demo_step_${nextStep}`,
                timestamp: engine.getRelativeTime(),
                realTimestamp: new Date().toLocaleTimeString().split(' ')[0],
                type: 'success',
                source: 'ai_predictor',
                message: '[Inference Router] Switched gateway route to Local Llama-3 in us-west-2. Systems entering recovering state.',
              }
            ]);
          } else if (nextStep === 15) {
            engine.injectChaos('token_flood');
          } else if (nextStep === 18) {
            engine.addMitigation({
              name: 'Context Compression Protocol',
              nodeId: 'truefoundry_gateway',
              type: 'context_compression',
              description: 'Compress active prompt templates by 60% using system summary instructions.',
              impactSummary: 'Reduces prompt token payload, resolving LLM gateway thread contention.',
            });
          } else if (nextStep === 21) {
            setAiDecisionLogs((prev) => [
              ...prev,
              {
                id: `aidec_demo_step_${nextStep}`,
                timestamp: engine.getRelativeTime(),
                realTimestamp: new Date().toLocaleTimeString().split(' ')[0],
                type: 'success',
                source: 'ai_predictor',
                message: '[Resource Calibrator] Token flood mitigated by context compression (60% payload size reduction). Latency normalized to 142ms. Resilience score: 95%.',
              }
            ]);
          } else if (nextStep >= 24) {
            engine.resolveAllChaos();
            engine.clearAllMitigations();
            setDemoActive(false);
            setIsAutonomous(true);
            setAiDecisionLogs((prev) => [
              ...prev,
              {
                id: `aidec_demo_end`,
                timestamp: engine.getRelativeTime(),
                realTimestamp: new Date().toLocaleTimeString().split(' ')[0],
                type: 'success',
                source: 'ai_predictor',
                message: '[Demo Director] CINEMATIC DEMO COMPLETED. All outages resolved. System normalized in US-East-1.',
              }
            ]);
            return 0;
          }
          
          return nextStep;
        });
      } else {
        // Generate normal SRE AI cognitive decision logs
        const generatedTraces = generateAIDecisionTrace(finalSnapshot, aiAnalysis.predictions, plans);
        if (generatedTraces.length > 0) {
          setAiDecisionLogs((prev) => {
            const next = [...prev, ...generatedTraces];
            if (next.length > 100) next.splice(0, next.length - 100);
            return next;
          });
        }
      }

      // Update states
      const refreshedSnapshot = engine.getSnapshot();
      setNodes(refreshedSnapshot.nodes);
      setConnections(refreshedSnapshot.connections);
      setLogs(refreshedSnapshot.logs);
      setMetrics((prev) => {
        const next = [...prev, refreshedSnapshot.metrics];
        if (next.length > 50) next.shift(); // keep 50 historical steps
        return next;
      });
      setActiveMitigations(refreshedSnapshot.activeMitigations);
      setActiveChaosIncidents(refreshedSnapshot.activeChaosIncidents);
      
      // Update AI Telemetry outputs
      setPredictions(aiAnalysis.predictions);
    };

    const id = setInterval(tick, intervalTime);
    return () => clearInterval(id);
  }, [screen, isPaused, isAutonomous, isReplaying, demoActive]);

  // Handle Chaos engineering triggers
  const handleInjectChaos = (type: ChaosType) => {
    const engine = simEngineRef.current;
    if (!engine) return;
    engine.injectChaos(type);
    
    // Force immediate UI updates
    const snap = engine.getSnapshot();
    setNodes(snap.nodes);
    setActiveChaosIncidents(snap.activeChaosIncidents);
    setLogs(snap.logs);
  };

  const handleResolveChaos = (id: string) => {
    const engine = simEngineRef.current;
    if (!engine) return;
    engine.resolveChaos(id);

    const snap = engine.getSnapshot();
    setNodes(snap.nodes);
    setActiveChaosIncidents(snap.activeChaosIncidents);
    setLogs(snap.logs);
  };

  const handleClearAllChaos = () => {
    const engine = simEngineRef.current;
    if (!engine) return;
    engine.resolveAllChaos();
    engine.clearAllMitigations();

    const snap = engine.getSnapshot();
    setNodes(snap.nodes);
    setActiveChaosIncidents(snap.activeChaosIncidents);
    setActiveMitigations(snap.activeMitigations);
    setLogs(snap.logs);
  };

  // Handle manual mitigation additions
  const handleAddMitigation = (mit: Omit<ActiveMitigation, 'id' | 'startedAt'>) => {
    const engine = simEngineRef.current;
    if (!engine) return;
    engine.addMitigation(mit);

    const snap = engine.getSnapshot();
    setNodes(snap.nodes);
    setActiveMitigations(snap.activeMitigations);
    setLogs(snap.logs);
  };

  const handleRemoveMitigation = (id: string) => {
    const engine = simEngineRef.current;
    if (!engine) return;
    engine.removeMitigation(id);

    const snap = engine.getSnapshot();
    setNodes(snap.nodes);
    setActiveMitigations(snap.activeMitigations);
    setLogs(snap.logs);
  };

  const handleClearLogs = () => {
    const engine = simEngineRef.current;
    const replay = replaySystemRef.current;
    if (!engine || !replay) return;
    engine.reset();
    replay.clear();
    const snap = engine.getSnapshot();
    replay.recordSnapshot(snap);
    setLogs(snap.logs);
    setMetrics([snap.metrics]);
    setSnapshots([snap]);
  };

  // Replay actions
  const handleToggleReplayMode = (active: boolean) => {
    const replay = replaySystemRef.current;
    if (!replay) return;
    replay.setReplaying(active);
    setIsReplaying(active);
    
    if (active) {
      const idx = replay.getSnapshots().length - 1;
      replay.setReplayIndex(idx);
      setReplayIndex(idx);
      
      // Set state to match replay index snapshot
      const snap = replay.getSnapshotAtIndex(idx);
      if (snap) {
        setNodes(snap.nodes);
        setConnections(snap.connections);
        setLogs(snap.logs);
        setActiveMitigations(snap.activeMitigations);
        setActiveChaosIncidents(snap.activeChaosIncidents);
      }
    } else {
      // Exit replay: load the latest simulator state
      const engine = simEngineRef.current;
      if (engine) {
        const snap = engine.getSnapshot();
        setNodes(snap.nodes);
        setConnections(snap.connections);
        setLogs(snap.logs);
        setActiveMitigations(snap.activeMitigations);
        setActiveChaosIncidents(snap.activeChaosIncidents);
      }
    }
  };

  const handleSetReplayIndex = (idx: number) => {
    const replay = replaySystemRef.current;
    if (!replay) return;
    replay.setReplayIndex(idx);
    setReplayIndex(idx);

    const snap = replay.getSnapshotAtIndex(idx);
    if (snap) {
      setNodes(snap.nodes);
      setConnections(snap.connections);
      setLogs(snap.logs);
      setActiveMitigations(snap.activeMitigations);
      setActiveChaosIncidents(snap.activeChaosIncidents);
    }
  };

  const handleStepForward = () => {
    const replay = replaySystemRef.current;
    if (!replay) return;
    const snap = replay.stepForward();
    if (snap) {
      setReplayIndex(replay.getReplayIndex());
      setNodes(snap.nodes);
      setConnections(snap.connections);
      setLogs(snap.logs);
      setActiveMitigations(snap.activeMitigations);
      setActiveChaosIncidents(snap.activeChaosIncidents);
    }
  };

  const handleStepBackward = () => {
    const replay = replaySystemRef.current;
    if (!replay) return;
    const snap = replay.stepBackward();
    if (snap) {
      setReplayIndex(replay.getReplayIndex());
      setNodes(snap.nodes);
      setConnections(snap.connections);
      setLogs(snap.logs);
      setActiveMitigations(snap.activeMitigations);
      setActiveChaosIncidents(snap.activeChaosIncidents);
    }
  };

  const handleLaunchControl = () => {
    setScreen('loading');
  };

  const handleLoadingComplete = () => {
    setScreen('dashboard');
    setIsPaused(false);
  };

  const handleExitControl = () => {
    setScreen('landing');
  };

  const handleStartDemo = () => {
    setDemoActive(true);
    setDemoStep(0);
    setIsAutonomous(false); // start manual to show collapse
    setIsPaused(false);
    setIsReplaying(false);
    
    const engine = simEngineRef.current;
    if (engine) {
      engine.reset();
      engine.resolveAllChaos();
      engine.clearAllMitigations();
      
      const snap = engine.getSnapshot();
      setNodes(snap.nodes);
      setConnections(snap.connections);
      setActiveChaosIncidents(snap.activeChaosIncidents);
      setActiveMitigations(snap.activeMitigations);
      setLogs(snap.logs);
      setMetrics([snap.metrics]);
      setAiDecisionLogs([
        {
          id: `aidec_demo_start`,
          timestamp: 0,
          realTimestamp: new Date().toLocaleTimeString().split(' ')[0],
          type: 'info',
          source: 'ai_predictor',
          message: '[Demo Director] CINEMATIC DEMO INITIATED. Baseline state nominal. 98% resilience index.',
        }
      ]);
    }
  };

  const handleStopDemo = () => {
    setDemoActive(false);
    setIsAutonomous(true);
    const engine = simEngineRef.current;
    if (engine) {
      engine.resolveAllChaos();
      engine.clearAllMitigations();
      const snap = engine.getSnapshot();
      setNodes(snap.nodes);
      setConnections(snap.connections);
      setActiveChaosIncidents(snap.activeChaosIncidents);
      setActiveMitigations(snap.activeMitigations);
      setLogs(snap.logs);
      setAiDecisionLogs((prev) => [
        ...prev,
        {
          id: `aidec_demo_stop`,
          timestamp: engine.getRelativeTime(),
          realTimestamp: new Date().toLocaleTimeString().split(' ')[0],
          type: 'info',
          source: 'ai_predictor',
          message: '[Demo Director] CINEMATIC DEMO TERMINATED. Restoring autopilot orchestration.',
        }
      ]);
    }
  };

  return (
    <>
      {screen === 'landing' ? (
        <LandingPage onLaunch={handleLaunchControl} />
      ) : screen === 'loading' ? (
        <LoadingScreen onComplete={handleLoadingComplete} />
      ) : (
        <Dashboard
          nodes={nodes}
          connections={connections}
          logs={logs}
          snapshots={snapshots}
          metrics={metrics}
          activeMitigations={activeMitigations}
          activeChaosIncidents={activeChaosIncidents}
          onInjectChaos={handleInjectChaos}
          onResolveChaos={handleResolveChaos}
          onClearAllChaos={handleClearAllChaos}
          isAutonomous={isAutonomous}
          onToggleAutonomous={() => setIsAutonomous(!isAutonomous)}
          isPaused={isPaused}
          onTogglePlayPause={() => setIsPaused(!isPaused)}
          onClearLogs={handleClearLogs}
          onAddMitigation={handleAddMitigation}
          onRemoveMitigation={handleRemoveMitigation}
          predictions={predictions}
          recoveryPlans={recoveryPlans}
          isReplaying={isReplaying}
          replayIndex={replayIndex}
          onToggleReplayMode={handleToggleReplayMode}
          onSetReplayIndex={handleSetReplayIndex}
          onStepForward={handleStepForward}
          onStepBackward={handleStepBackward}
          onExit={handleExitControl}
          aiDecisionLogs={aiDecisionLogs}
          demoActive={demoActive}
          demoStep={demoStep}
          onStartDemo={handleStartDemo}
          onStopDemo={handleStopDemo}
        />
      )}
    </>
  );
}

const generateAIDecisionTrace = (
  snapshot: SimulationSnapshot,
  predictions: CascadePrediction[],
  recoveryPlans: RecoveryPlan[]
): LogEntry[] => {
  const newTraces: LogEntry[] = [];
  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const realTimestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const timestamp = snapshot.timestamp;

  const createLog = (message: string, type: 'info' | 'warning' | 'error' | 'success'): LogEntry => ({
    id: `aidec_${Math.random().toString(36).substring(2, 9)}`,
    timestamp,
    realTimestamp,
    type,
    source: 'ai_predictor',
    message,
  });

  // 1. Analyze Active Chaos and predictions
  if (snapshot.activeChaosIncidents.length > 0) {
    snapshot.activeChaosIncidents.forEach((chaos) => {
      const matchingPredictions = predictions.filter(p => p.sourceNodeId === chaos.nodeId);
      if (matchingPredictions.length > 0) {
        matchingPredictions.forEach((pred) => {
          newTraces.push(createLog(
            `[Anomaly Detector] Predicted SLA breach probability on [${pred.nodeId}]: ${Math.round(pred.probability * 100)}%. Est. time to outage: ${pred.timeToOutageSeconds}s. Cause: ${pred.reason}`,
            'error'
          ));
        });
      } else {
        newTraces.push(createLog(
          `[Anomaly Detector] Active infrastructure degradation: ${chaos.description}. Node status: CRITICAL.`,
          'error'
        ));
      }
    });
  }

  // 2. Routing logic decisions (deciding models)
  const openRouter = snapshot.nodes.find(n => n.id === 'truefoundry_gateway');
  if (openRouter) {
    const activeModel = openRouter.activeModel;
    if (snapshot.activeChaosIncidents.some(c => c.type === 'openai_outage')) {
      newTraces.push(createLog(
        `[Inference Router] OpenAI outage detected. Policy override engaged: Route traffic to fallback provider (${activeModel}).`,
        'warning'
      ));
    } else if (snapshot.activeChaosIncidents.some(c => c.type === 'regional_outage')) {
      newTraces.push(createLog(
        `[Inference Router] Regional AWS US-East-1 connection blacked out. Failover route optimized to us-west-2 Local Llama node.`,
        'warning'
      ));
    } else {
      const rps = snapshot.nodes.find(n => n.id === 'api_gateway')?.throughput || 0;
      if (rps > 0 && Math.random() < 0.25) {
        newTraces.push(createLog(
          `[Inference Router] Inference route optimized: 100% of requests routed to OpenAI (${activeModel}) via TrueFoundry Gateway.`,
          'success'
        ));
      }
    }
  }

  // 3. Mitigation reasoning
  if (snapshot.activeMitigations.length > 0) {
    snapshot.activeMitigations.forEach((mit) => {
      if (Math.random() < 0.3) {
        newTraces.push(createLog(
          `[Resilience Engine] Policy active: [${mit.name}]. Action: ${mit.description}. Expected result: ${mit.impactSummary}.`,
          'success'
        ));
      }
    });
  }

  // 4. Recovery recommendations if unmitigated
  if (recoveryPlans.length > 0) {
    recoveryPlans.forEach((plan) => {
      if (Math.random() < 0.25) {
        newTraces.push(createLog(
          `[Mitigation Advisor] Queuing recovery strategy: [${plan.name}]. Rationale: ${plan.rationale}`,
          'info'
        ));
      }
    });
  }

  // 5. General health metrics checks if healthy
  if (snapshot.activeChaosIncidents.length === 0 && snapshot.activeMitigations.length === 0) {
    const rps = snapshot.nodes.find(n => n.id === 'api_gateway')?.throughput || 0;
    const latency = snapshot.metrics.averageLatency;
    const uptime = snapshot.metrics.uptime;
    const rand = Math.random();
    if (rand < 0.08) {
      newTraces.push(createLog(
        `[Resource Calibrator] Overall Uptime: ${uptime}%. System load nominal at ${Math.round(rps)} RPS. Average latency: ${latency}ms.`,
        'info'
      ));
    } else if (rand < 0.16) {
      newTraces.push(createLog(
        `[Observability Agent] Checking critical path: Gateway ➔ Router ➔ Cache ➔ Swarm Core ➔ LLM Router ➔ Upstream LLM. All connection metrics within green SLA boundaries.`,
        'info'
      ));
    } else if (rand < 0.24) {
      newTraces.push(createLog(
        `[Predictive SRE] System topology telemetry scanned. No anomalous resource behavior or retry storms detected in the log buffer.`,
        'success'
      ));
    } else if (rand < 0.32) {
      newTraces.push(createLog(
        `[Routing Planner] TrueFoundry AI Gateway health check passed. Active latency calibration normal.`,
        'success'
      ));
    }
  }

  return newTraces;
};

export default App;
