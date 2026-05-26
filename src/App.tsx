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

      // Apply mitigations automatically if in Autonomous Mode
      if (isAutonomous && plans.length > 0) {
        plans.forEach((plan) => {
          engine.addMitigation({
            name: plan.name,
            nodeId: plan.targetNodeId,
            type: plan.type,
            description: plan.description,
            impactSummary: plan.expectedOutcome,
          });
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

      // Update states
      setNodes(finalSnapshot.nodes);
      setConnections(finalSnapshot.connections);
      setLogs(finalSnapshot.logs);
      setMetrics((prev) => {
        const next = [...prev, finalSnapshot.metrics];
        if (next.length > 50) next.shift(); // keep 50 historical steps
        return next;
      });
      setActiveMitigations(finalSnapshot.activeMitigations);
      setActiveChaosIncidents(finalSnapshot.activeChaosIncidents);
      
      // Update AI Telemetry outputs
      setPredictions(aiAnalysis.predictions);
    };

    const id = setInterval(tick, intervalTime);
    return () => clearInterval(id);
  }, [screen, isPaused, isAutonomous, isReplaying]);

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
        />
      )}
    </>
  );
}
export default App;
