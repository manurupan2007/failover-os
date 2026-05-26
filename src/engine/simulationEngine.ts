import type {
  NodeState,
  ConnectionState,
  LogEntry,
  SystemMetrics,
  ActiveMitigation,
  ChaosIncident,
  SimulationSnapshot,
  ChaosType,
  LogType,
} from './types';

// Initial topology setup
export const INITIAL_NODES: NodeState[] = [
  {
    id: 'api_gateway',
    name: 'API Gateway (Edge)',
    type: 'gateway',
    status: 'healthy',
    latency: 8,
    throughput: 45,
    errorRate: 0.0,
    cost: 0.0,
    queueDepth: 0,
    maxQueueDepth: 100,
    promptCompressionRatio: 1.0,
    recoveryProgress: 0,
    cpuUsage: 12,
    memoryUsage: 25,
    region: 'us-east-1',
  },
  {
    id: 'semantic_router',
    name: 'Semantic Router',
    type: 'router',
    status: 'healthy',
    latency: 12,
    throughput: 45,
    errorRate: 0.0,
    cost: 0.0002,
    queueDepth: 0,
    maxQueueDepth: 80,
    promptCompressionRatio: 1.0,
    recoveryProgress: 0,
    cpuUsage: 8,
    memoryUsage: 18,
    region: 'us-east-1',
  },
  {
    id: 'prompt_cache',
    name: 'Redis Prompt Cache',
    type: 'cache',
    status: 'healthy',
    latency: 3,
    throughput: 45,
    errorRate: 0.0,
    cost: 0.0,
    queueDepth: 0,
    maxQueueDepth: 500,
    promptCompressionRatio: 1.0,
    recoveryProgress: 0,
    cpuUsage: 5,
    memoryUsage: 42,
    region: 'us-east-1',
  },
  {
    id: 'agent_executor',
    name: 'Agent Swarm Core',
    type: 'agent',
    status: 'healthy',
    latency: 45,
    throughput: 34, // cache absorbs some traffic
    errorRate: 0.0,
    cost: 0.001,
    queueDepth: 0,
    maxQueueDepth: 50,
    promptCompressionRatio: 1.0,
    recoveryProgress: 0,
    cpuUsage: 15,
    memoryUsage: 35,
    region: 'us-east-1',
  },
  {
    id: 'vector_db',
    name: 'Pinecone Vector DB',
    type: 'vectorDB',
    status: 'healthy',
    latency: 32,
    throughput: 34,
    errorRate: 0.0,
    cost: 0.003,
    queueDepth: 0,
    maxQueueDepth: 120,
    promptCompressionRatio: 1.0,
    recoveryProgress: 0,
    cpuUsage: 10,
    memoryUsage: 28,
    region: 'us-east-1',
  },
  {
    id: 'mcp_server',
    name: 'MCP Tool Executor',
    type: 'mcp',
    status: 'healthy',
    latency: 25,
    throughput: 20, // only tool calls go here
    errorRate: 0.0,
    cost: 0.0005,
    queueDepth: 0,
    maxQueueDepth: 60,
    promptCompressionRatio: 1.0,
    recoveryProgress: 0,
    cpuUsage: 7,
    memoryUsage: 15,
    region: 'us-east-1',
  },
  {
    id: 'truefoundry_gateway',
    name: 'TrueFoundry AI Gateway',
    type: 'router',
    status: 'healthy',
    latency: 5,
    throughput: 34,
    errorRate: 0.0,
    cost: 0.0,
    queueDepth: 0,
    maxQueueDepth: 150,
    activeModel: 'gpt-4o',
    promptCompressionRatio: 1.0,
    recoveryProgress: 0,
    cpuUsage: 4,
    memoryUsage: 10,
    region: 'us-east-1',
  },
  {
    id: 'openai_provider',
    name: 'OpenAI API Gateway',
    type: 'llm',
    status: 'healthy',
    latency: 320,
    throughput: 34,
    errorRate: 0.0,
    cost: 0.015, // Cost per 1k tokens equivalent (simulated per request scaling)
    queueDepth: 0,
    maxQueueDepth: 300,
    activeModel: 'gpt-4o',
    promptCompressionRatio: 1.0,
    recoveryProgress: 0,
    cpuUsage: 2,
    memoryUsage: 5,
    region: 'us-east-1',
  },
  {
    id: 'anthropic_provider',
    name: 'Anthropic API Endpoint',
    type: 'llm',
    status: 'healthy',
    latency: 410,
    throughput: 0, // Standby initially
    errorRate: 0.0,
    cost: 0.03, // Premium cost
    queueDepth: 0,
    maxQueueDepth: 200,
    activeModel: 'claude-3-5-sonnet',
    promptCompressionRatio: 1.0,
    recoveryProgress: 0,
    cpuUsage: 0,
    memoryUsage: 2,
    region: 'us-east-1',
  },
  {
    id: 'local_llama_provider',
    name: 'Local Llama-3 Edge Node',
    type: 'llm',
    status: 'healthy',
    latency: 180,
    throughput: 0, // Standby initially
    errorRate: 0.0,
    cost: 0.001, // Compute hosting cost only
    queueDepth: 0,
    maxQueueDepth: 40,
    activeModel: 'llama-3-8b-instruct',
    promptCompressionRatio: 1.0,
    recoveryProgress: 0,
    cpuUsage: 0,
    memoryUsage: 4,
    region: 'us-west-2',
  },
];

export const INITIAL_CONNECTIONS: ConnectionState[] = [
  { id: 'c1', source: 'api_gateway', target: 'semantic_router', status: 'active', latency: 2, load: 45 },
  { id: 'c2', source: 'semantic_router', target: 'prompt_cache', status: 'active', latency: 1, load: 45 },
  { id: 'c3', source: 'semantic_router', target: 'agent_executor', status: 'active', latency: 4, load: 34 },
  { id: 'c4', source: 'agent_executor', target: 'vector_db', status: 'active', latency: 5, load: 34 },
  { id: 'c5', source: 'agent_executor', target: 'mcp_server', status: 'active', latency: 8, load: 20 },
  { id: 'c6', source: 'agent_executor', target: 'truefoundry_gateway', status: 'active', latency: 3, load: 34 },
  { id: 'c7', source: 'truefoundry_gateway', target: 'openai_provider', status: 'active', latency: 10, load: 34 },
  { id: 'c8', source: 'truefoundry_gateway', target: 'anthropic_provider', status: 'active', latency: 15, load: 0 },
  { id: 'c9', source: 'truefoundry_gateway', target: 'local_llama_provider', status: 'active', latency: 30, load: 0 },
];

export const DEFAULT_METRICS: SystemMetrics = {
  uptime: 100.0,
  overallResilienceScore: 98.0,
  averageLatency: 410, // Cumulative path latency
  totalCost: 0.0,
  savedCost: 0.0,
  recoveryEfficiency: 100.0,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
};

export class SimulationEngine {
  private nodes: NodeState[] = [];
  private connections: ConnectionState[] = [];
  private logs: LogEntry[] = [];
  private metrics: SystemMetrics = { ...DEFAULT_METRICS };
  private activeMitigations: ActiveMitigation[] = [];
  private activeChaosIncidents: ChaosIncident[] = [];
  private relativeTime = 0; // simulated ticks (each tick is 1s, represented by 1000ms increment)
  private totalTicks = 0;

  // Custom configuration parameters
  public targetThroughput = 45; // target RPS
  public isPaused = false;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.nodes = INITIAL_NODES.map((n) => ({ ...n }));
    this.connections = INITIAL_CONNECTIONS.map((c) => ({ ...c }));
    this.logs = [];
    this.metrics = { ...DEFAULT_METRICS };
    this.activeMitigations = [];
    this.activeChaosIncidents = [];
    this.relativeTime = 0;
    this.totalTicks = 0;

    this.addLog(
      'info',
      'simulation',
      'FailoverOS kernel booted. Simulation context initialized.'
    );
    this.addLog(
      'success',
      'simulation',
      'Autonomous orchestration layer active. Policy engines online.'
    );
  }

  public getNodes(): NodeState[] {
    return this.nodes;
  }

  public getConnections(): ConnectionState[] {
    return this.connections;
  }

  public getLogs(): LogEntry[] {
    return this.logs;
  }

  public getMetrics(): SystemMetrics {
    return this.metrics;
  }

  public getActiveMitigations(): ActiveMitigation[] {
    return this.activeMitigations;
  }

  public getActiveChaosIncidents(): ChaosIncident[] {
    return this.activeChaosIncidents;
  }

  public getRelativeTime(): number {
    return this.relativeTime;
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public addLog(
    type: LogType,
    source: LogEntry['source'],
    message: string,
    nodeId?: string
  ): void {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const realTimestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    this.logs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: this.relativeTime,
      realTimestamp,
      nodeId,
      type,
      source,
      message,
    });

    // Cap logs at 200
    if (this.logs.length > 200) {
      this.logs.pop();
    }
  }

  public injectChaos(type: ChaosType): void {
    if (this.activeChaosIncidents.some((c) => c.type === type)) {
      this.addLog('warning', 'chaos_injector', `Incident [${type}] is already active in target segment.`);
      return;
    }

    let nodeId = '';
    let severity: ChaosIncident['severity'] = 'medium';
    let description = '';

    switch (type) {
      case 'openai_outage':
        nodeId = 'openai_provider';
        severity = 'critical';
        description = 'Primary OpenAI API endpoint returning HTTP 503 Service Unavailable';
        break;
      case 'claude_timeout':
        nodeId = 'anthropic_provider';
        severity = 'high';
        description = 'Anthropic Claude endpoint experiencing 15s transit timeouts';
        break;
      case 'vector_db_corruption':
        nodeId = 'vector_db';
        severity = 'critical';
        description = 'Pinecone index partition segment corrupted. Search requests returning schema error.';
        break;
      case 'mcp_server_crash':
        nodeId = 'mcp_server';
        severity = 'high';
        description = 'MCP Host crashed due to memory segmentation fault in local python executor';
        break;
      case 'token_spike':
        nodeId = 'api_gateway';
        severity = 'medium';
        description = 'Sudden burst of heavy prompt structures (>250k tokens per request)';
        break;
      case 'rate_limit_failure':
        nodeId = 'openai_provider';
        severity = 'high';
        description = 'OpenAI API returns HTTP 429 Too Many Requests due to rate limit exhaustion';
        break;
      case 'retry_storm':
        nodeId = 'agent_executor';
        severity = 'high';
        description = 'Unregulated aggressive Agent retry cycles overloading gateway queue layers';
        break;
      case 'latency_spike':
        nodeId = 'openai_provider';
        severity = 'medium';
        description = '3000ms regional router congestion delay in OpenAI API routes';
        break;
      case 'memory_overflow':
        nodeId = 'api_gateway';
        severity = 'high';
        description = 'Gateway buffer overflow. Heavy heap garbage collection causes node freezes.';
        break;
      case 'queue_congestion':
        nodeId = 'agent_executor';
        severity = 'medium';
        description = 'Agent Task Queue depth exceeded limit. Buffer latency rising.';
        break;
      case 'agent_deadlock':
        nodeId = 'agent_executor';
        severity = 'high';
        description = 'Agent Swarm locked in a cyclic tool-dependency state. High CPU loops.';
        break;
    }

    const incident: ChaosIncident = {
      id: `incident_${Math.random().toString(36).substring(2, 6)}`,
      type,
      nodeId,
      severity,
      description,
      timestamp: this.relativeTime,
    };

    this.activeChaosIncidents.push(incident);
    this.addLog('error', 'chaos_injector', `CHAOS INJECTED: [${severity.toUpperCase()}] ${description}`, nodeId);
  }

  public resolveChaos(incidentId: string): void {
    const index = this.activeChaosIncidents.findIndex((c) => c.id === incidentId);
    if (index === -1) return;

    const incident = this.activeChaosIncidents[index];
    incident.resolvedAt = this.relativeTime;
    this.activeChaosIncidents.splice(index, 1);

    const node = this.nodes.find((n) => n.id === incident.nodeId);
    if (node) {
      node.status = 'recovering';
      node.recoveryProgress = 0;
      node.failureReason = undefined;
      this.addLog('info', 'recovery_engine', `Incident resolved. Node [${node.name}] entering cooldown recovery state.`, node.id);
    }
  }

  public resolveAllChaos(): void {
    this.activeChaosIncidents.forEach((c) => {
      const node = this.nodes.find((n) => n.id === c.nodeId);
      if (node) {
        node.status = 'recovering';
        node.recoveryProgress = 0;
        node.failureReason = undefined;
      }
    });
    this.activeChaosIncidents = [];
    this.addLog('success', 'recovery_engine', 'All injected failure profiles cleared. Healing systems initiated.');
  }

  public addMitigation(mitigation: Omit<ActiveMitigation, 'id' | 'startedAt'>): void {
    const id = `mit_${Math.random().toString(36).substring(2, 6)}`;
    const newMitigation: ActiveMitigation = {
      ...mitigation,
      id,
      startedAt: this.relativeTime,
    };
    this.activeMitigations.push(newMitigation);
    this.addLog('success', 'recovery_engine', `POLICY APPLIED: ${newMitigation.description}`, newMitigation.nodeId);
  }

  public removeMitigation(id: string): void {
    const index = this.activeMitigations.findIndex((m) => m.id === id);
    if (index === -1) return;
    const mitigation = this.activeMitigations[index];
    this.activeMitigations.splice(index, 1);
    this.addLog('info', 'recovery_engine', `POLICY RETIRED: Removed resilience policy [${mitigation.name}]`, mitigation.nodeId);
  }

  public clearAllMitigations(): void {
    this.activeMitigations = [];
    this.addLog('info', 'recovery_engine', 'All active resilience mitigations disabled.');
  }

  // Primary execution cycle
  public tick(aiRoutingHook?: (engine: SimulationEngine) => void): SimulationSnapshot {
    if (this.isPaused) {
      return this.getSnapshot();
    }

    this.relativeTime += 1000;
    this.totalTicks += 1;

    // Reset temporary states
    this.nodes.forEach((node) => {
      node.throughput = 0;
      node.latency = this.getBaseLatency(node.id);
      node.errorRate = 0.0;
      node.cpuUsage = this.getBaseCpu(node.id);
      node.memoryUsage = this.getBaseMemory(node.id);
    });

    // Step 1: Process active mitigations and recovery progress
    this.processRecoveries();

    // Step 2: Apply Primary Failure Incidents
    this.applyInjectedFailures();

    // Step 3: Run Cascading Failure Propagation (Heuristics)
    this.propagateCascades();

    // Step 4: Apply Active Resilience Policies (Autonomous Recovery Engine)
    this.applyActivePolicies();

    // Step 5: Route traffic and calculate node throughputs
    this.routeTraffic(aiRoutingHook);

    // Step 6: Update Node Resources (CPU, Memory, Queues)
    this.updateNodeResources();

    // Step 7: Update connection stats
    this.updateConnections();

    // Step 8: Update overall system metrics
    this.calculateSystemMetrics();

    return this.getSnapshot();
  }

  private getBaseLatency(nodeId: string): number {
    switch (nodeId) {
      case 'api_gateway': return 5;
      case 'semantic_router': return 10;
      case 'prompt_cache': return 2;
      case 'agent_executor': return 35;
      case 'vector_db': return 28;
      case 'mcp_server': return 20;
      case 'truefoundry_gateway': return 2;
      case 'openai_provider': return 280;
      case 'anthropic_provider': return 360;
      case 'local_llama_provider': return 140;
      default: return 0;
    }
  }

  private getBaseCpu(nodeId: string): number {
    switch (nodeId) {
      case 'api_gateway': return 8;
      case 'semantic_router': return 5;
      case 'prompt_cache': return 4;
      case 'agent_executor': return 12;
      case 'vector_db': return 8;
      case 'mcp_server': return 5;
      case 'truefoundry_gateway': return 3;
      case 'openai_provider': return 1;
      case 'anthropic_provider': return 1;
      case 'local_llama_provider': return 0;
      default: return 0;
    }
  }

  private getBaseMemory(nodeId: string): number {
    switch (nodeId) {
      case 'api_gateway': return 15;
      case 'semantic_router': return 12;
      case 'prompt_cache': return 35;
      case 'agent_executor': return 28;
      case 'vector_db': return 22;
      case 'mcp_server': return 10;
      case 'truefoundry_gateway': return 8;
      case 'openai_provider': return 3;
      case 'anthropic_provider': return 2;
      case 'local_llama_provider': return 0;
      default: return 0;
    }
  }

  private processRecoveries(): void {
    this.nodes.forEach((node) => {
      if (node.status === 'recovering') {
        node.recoveryProgress += 20; // 5 ticks to recover completely (5s)
        node.latency = this.getBaseLatency(node.id) * 1.5;
        node.errorRate = 0.15;
        node.cpuUsage = this.getBaseCpu(node.id) * 2;
        node.memoryUsage = this.getBaseMemory(node.id) * 1.2;

        if (node.recoveryProgress >= 100) {
          node.status = 'healthy';
          node.recoveryProgress = 0;
          this.addLog('success', 'recovery_engine', `Node [${node.name}] successfully recovered and calibrated. Uptime normal.`, node.id);
        }
      }
    });
  }

  private applyInjectedFailures(): void {
    this.activeChaosIncidents.forEach((incident) => {
      const node = this.nodes.find((n) => n.id === incident.nodeId);
      if (!node) return;

      node.status = 'critical';

      switch (incident.type) {
        case 'openai_outage':
          node.errorRate = 1.0;
          node.latency = 12000; // timeout threshold simulation
          node.failureReason = '503 Service Unavailable';
          node.cpuUsage = 95;
          node.memoryUsage = 85;
          break;

        case 'claude_timeout':
          node.errorRate = 0.9;
          node.latency = 15000;
          node.failureReason = 'Transit Gateway Timeout';
          node.cpuUsage = 80;
          node.memoryUsage = 70;
          break;

        case 'vector_db_corruption':
          node.errorRate = 0.95;
          node.latency = 900;
          node.failureReason = 'Segment Checksum Mismatch';
          node.cpuUsage = 85;
          node.memoryUsage = 92;
          break;

        case 'mcp_server_crash':
          node.errorRate = 1.0;
          node.latency = 0;
          node.failureReason = 'SIGSEGV Process Terminated';
          node.cpuUsage = 0;
          node.memoryUsage = 0;
          break;

        case 'token_spike':
          // Token spike increases processing latency and memory usage on api gateway and agent executor
          node.status = 'unstable';
          node.latency = this.getBaseLatency(node.id) * 3;
          node.memoryUsage = Math.min(node.memoryUsage * 3.5, 95);
          node.cpuUsage = Math.min(node.cpuUsage * 3, 90);
          node.failureReason = 'Prompt Size Exceeds Standard Frame Buffer';
          break;

        case 'rate_limit_failure':
          node.errorRate = 0.85;
          node.latency = 50; // returns 429 immediately
          node.failureReason = '429 Rate Limit Exhausted';
          node.cpuUsage = 40;
          node.memoryUsage = 25;
          break;

        case 'latency_spike':
          node.status = 'unstable';
          node.latency = this.getBaseLatency(node.id) + 3000;
          node.failureReason = 'Transit latency degradation';
          node.cpuUsage = 15;
          node.memoryUsage = 10;
          break;

        case 'memory_overflow':
          node.status = 'critical';
          node.errorRate = 0.55;
          node.latency = 350; // GC pauses
          node.memoryUsage = 99;
          node.cpuUsage = 98;
          node.failureReason = 'Java/V8 OutOfMemory heap ceiling';
          break;

        case 'queue_congestion':
          node.status = 'unstable';
          node.queueDepth = Math.round(node.maxQueueDepth * 0.95);
          node.latency = this.getBaseLatency(node.id) * 4;
          node.cpuUsage = 70;
          node.memoryUsage = 60;
          node.failureReason = 'Task Buffer Congested (>90% full)';
          break;

        case 'agent_deadlock':
          node.status = 'critical';
          node.errorRate = 0.7;
          node.latency = 8000;
          node.cpuUsage = 100;
          node.memoryUsage = 92;
          node.failureReason = 'Cyclic Loop in ReAct Chain';
          break;
        case 'retry_storm':
          node.status = 'unstable';
          node.cpuUsage = 95;
          node.memoryUsage = 80;
          node.failureReason = 'Aggressive Retry Loop Storm';
          break;
      }
    });
  }

  private propagateCascades(): void {
    // We simulate failure propagation across nodes when actions are unmitigated
    const isIncident = (type: ChaosType) => this.activeChaosIncidents.some((c) => c.type === type);
    const hasMitigation = (type: string, nodeId: string) => this.activeMitigations.some((m) => m.type === type && m.nodeId === nodeId);

    // 1. OpenAI Outage -> If no failover, Agent Executor queue depth fills up, CPU spikes, router fails.
    if (isIncident('openai_outage') && !hasMitigation('failover', 'truefoundry_gateway')) {
      const agent = this.nodes.find((n) => n.id === 'agent_executor')!;
      const openAiRouter = this.nodes.find((n) => n.id === 'truefoundry_gateway')!;

      openAiRouter.status = 'critical';
      openAiRouter.errorRate = 1.0;
      openAiRouter.failureReason = 'All upstream targets failed (Unmitigated OpenAI Outage)';

      // Queue builds up in Agent
      agent.status = 'critical';
      agent.queueDepth = Math.min(agent.queueDepth + 15, agent.maxQueueDepth);
      agent.cpuUsage = 98;

      if (agent.queueDepth >= agent.maxQueueDepth) {
        agent.errorRate = 0.8;
        agent.failureReason = 'Agent core queue buffer overflow';
      }

      // Propagates back to Semantic Router and Gateway
      const gateway = this.nodes.find((n) => n.id === 'api_gateway')!;
      gateway.status = 'unstable';
      gateway.latency = Math.min(gateway.latency + 80, 500);

      if (agent.errorRate > 0.5) {
        gateway.status = 'critical';
        gateway.errorRate = 0.5;
        gateway.failureReason = 'Agent swarm backend failing';
      }
    }

    // 2. Vector DB Corruption -> If no Circuit Breaker, Agent Executor latency increases by 1000ms, CPU spikes, error rate rises
    if (isIncident('vector_db_corruption')) {
      const agent = this.nodes.find((n) => n.id === 'agent_executor')!;

      if (!hasMitigation('circuit_breaking', 'vector_db') && !hasMitigation('degraded_mode', 'agent_executor')) {
        agent.status = 'unstable';
        agent.latency += 800; // Agent waits for corrupt DB searches to time out
        agent.errorRate = Math.min(agent.errorRate + 0.35, 1.0);
        agent.cpuUsage = Math.min(agent.cpuUsage + 40, 100);

        if (this.totalTicks % 3 === 0) {
          this.addLog('warning', 'ai_predictor', 'Unmitigated VectorDB corruption propagating. Delaying Agent ReAct cycles.', 'agent_executor');
        }
      }
    }

    // 3. MCP Server Crash -> Agent Executor fails to execute tools.
    if (isIncident('mcp_server_crash')) {
      const agent = this.nodes.find((n) => n.id === 'agent_executor')!;
      if (!hasMitigation('degraded_mode', 'agent_executor')) {
        agent.status = 'unstable';
        agent.errorRate = Math.min(agent.errorRate + 0.25, 0.7);
        agent.cpuUsage = Math.min(agent.cpuUsage + 20, 90);
        agent.failureReason = 'MCP Tool execution failed';
      }
    }

    // 4. Retry Storm -> If no circuit breaker/rate-limiter, throughput doubles at gateway, triggering memory overflows and latency spikes.
    if (isIncident('retry_storm')) {
      const gateway = this.nodes.find((n) => n.id === 'api_gateway')!;
      const semanticRouter = this.nodes.find((n) => n.id === 'semantic_router')!;

      if (!hasMitigation('circuit_breaking', 'semantic_router')) {
        gateway.status = 'critical';
        gateway.latency += 200;
        gateway.cpuUsage = 95;
        gateway.memoryUsage = Math.min(gateway.memoryUsage + 15, 98);
        gateway.errorRate = Math.min(gateway.errorRate + 0.15, 0.5);

        semanticRouter.status = 'unstable';
        semanticRouter.queueDepth = Math.min(semanticRouter.queueDepth + 20, semanticRouter.maxQueueDepth);

        if (this.totalTicks % 4 === 0) {
          this.addLog('warning', 'ai_predictor', 'Retry storm detected. API Gateway heap buffer depleting rapidly.', 'api_gateway');
        }
      }
    }

    // 5. Rate Limit Failure -> Triggers agent retry storm if context compression or fallback is not active.
    if (isIncident('rate_limit_failure') && !hasMitigation('failover', 'truefoundry_gateway')) {
      // Prompt context compression can alleviate this somewhat by reducing tokens.
      const hasCompression = hasMitigation('context_compression', 'truefoundry_gateway');
      const openAiProvider = this.nodes.find((n) => n.id === 'openai_provider')!;
      const openAiRouter = this.nodes.find((n) => n.id === 'truefoundry_gateway')!;

      if (hasCompression) {
        // Less critical if token usage drops
        openAiProvider.errorRate = 0.35; // reduces error rate
        openAiProvider.failureReason = 'Rate Limit (429) - Alleviated by context compression (60% reduction)';
      } else {
        // Unmitigated rate limit -> triggers cascading retry loop on agent
        const agent = this.nodes.find((n) => n.id === 'agent_executor')!;
        agent.status = 'unstable';
        agent.queueDepth = Math.min(agent.queueDepth + 10, agent.maxQueueDepth);
        openAiRouter.errorRate = 0.85;
      }
    }
  }

  private applyActivePolicies(): void {
    this.activeMitigations.forEach((policy) => {
      const node = this.nodes.find((n) => n.id === policy.nodeId);
      if (!node) return;

      switch (policy.type) {
        case 'failover':
          if (node.id === 'truefoundry_gateway') {
            // Managed in routing
            node.status = 'recovering';
          }
          break;

        case 'circuit_breaking':
          if (policy.nodeId === 'vector_db') {
            // Isolates corrupt Vector DB, preventing latency propagation
            const vectorDb = this.nodes.find((n) => n.id === 'vector_db')!;
            vectorDb.status = 'critical';
            vectorDb.failureReason = 'CIRCUIT BREAKER: TRIPPED (Isolated)';

            const agent = this.nodes.find((n) => n.id === 'agent_executor')!;
            // Latency doesn't propagate because database queries are skipped/mocked
            agent.latency = this.getBaseLatency(agent.id) + 10; // tiny overhead only
            agent.cpuUsage = Math.max(agent.cpuUsage - 20, 10);
          }
          if (policy.nodeId === 'semantic_router') {
            // API Gateway stops sending traffic to semantic router during heavy storm
            const gateway = this.nodes.find((n) => n.id === 'api_gateway')!;
            gateway.status = 'healthy';
            gateway.errorRate = 0.1; // tiny error rate for shedding traffic
            gateway.latency = this.getBaseLatency('api_gateway');
          }
          break;

        case 'context_compression':
          if (policy.nodeId === 'truefoundry_gateway') {
            const openAiRouter = this.nodes.find((n) => n.id === 'truefoundry_gateway')!;
            openAiRouter.promptCompressionRatio = 0.4; // 60% compression
            // Decreases upstream LLM latency by 20%
            this.nodes.forEach((n) => {
              if (n.type === 'llm' && n.status !== 'critical') {
                n.latency = Math.round(n.latency * 0.7);
              }
            });
          }
          break;

        case 'degraded_mode':
          if (policy.nodeId === 'agent_executor') {
            const agent = this.nodes.find((n) => n.id === 'agent_executor')!;
            agent.status = 'healthy';
            agent.errorRate = 0.05; // tiny error rate (degraded function fallback)
            agent.latency = this.getBaseLatency('agent_executor') - 10; // faster execution because vectors/tool queries are stubbed
            agent.failureReason = 'DEGRADED OPERATION ACTIVE (Fallback static tools)';
          }
          break;

        case 'load_rebalancing':
          // Re-allocates resources
          this.nodes.forEach((n) => {
            if (n.status === 'unstable') {
              n.status = 'healthy';
              n.queueDepth = Math.round(n.queueDepth * 0.5);
            }
          });
          break;
      }
    });
  }

  private routeTraffic(aiRoutingHook?: (engine: SimulationEngine) => void): void {
    // base entry load
    let currentRps = this.targetThroughput;
    const isIncident = (type: ChaosType) => this.activeChaosIncidents.some((c) => c.type === type);
    const hasMitigation = (type: string, nodeId: string) => this.activeMitigations.some((m) => m.type === type && m.nodeId === nodeId);

    // Apply retry storm loads if unmitigated
    if (isIncident('retry_storm') && !hasMitigation('circuit_breaking', 'semantic_router')) {
      currentRps *= 2.5; // Multiplied throughput
    }

    // Set throughput recursively down the nodes
    const get = (id: string) => this.nodes.find((n) => n.id === id)!;
    const conn = (src: string, tgt: string) => this.connections.find((c) => c.source === src && c.target === tgt)!;

    // Gateway
    const gateway = get('api_gateway');
    gateway.throughput = currentRps;
    conn('api_gateway', 'semantic_router').load = currentRps;

    // Router
    const router = get('semantic_router');
    router.throughput = currentRps;

    // Route Cache hit (30% hits)
    const cacheHitRate = hasMitigation('circuit_breaking', 'semantic_router') ? 0.0 : 0.3;
    const cacheRps = currentRps;
    const agentRps = currentRps * (1 - cacheHitRate);

    const cache = get('prompt_cache');
    cache.throughput = cacheRps;
    conn('semantic_router', 'prompt_cache').load = cacheRps;

    const agent = get('agent_executor');
    agent.throughput = agentRps;
    conn('semantic_router', 'agent_executor').load = agentRps;

    // Agent to Vector DB (RAG)
    const vectorDb = get('vector_db');
    let vectorRps = agentRps;
    if (hasMitigation('circuit_breaking', 'vector_db') || hasMitigation('degraded_mode', 'agent_executor')) {
      vectorRps = 0; // Cut off completely
    }
    vectorDb.throughput = vectorRps;
    conn('agent_executor', 'vector_db').load = vectorRps;

    // Agent to MCP Server
    const mcp = get('mcp_server');
    let mcpRps = agentRps * 0.6;
    if (hasMitigation('degraded_mode', 'agent_executor')) {
      mcpRps = 0; // fallback to static, bypass MCP tool calls
    }
    mcp.throughput = mcpRps;
    conn('agent_executor', 'mcp_server').load = mcpRps;

    // Agent to LLM Router
    const llmRouter = get('truefoundry_gateway');
    llmRouter.throughput = agentRps;
    conn('agent_executor', 'truefoundry_gateway').load = agentRps;

    // LLM routing decision
    const openai = get('openai_provider');
    const anthropic = get('anthropic_provider');
    const localLlama = get('local_llama_provider');

    const connOpenai = conn('truefoundry_gateway', 'openai_provider');
    const connAnthropic = conn('truefoundry_gateway', 'anthropic_provider');
    const connLlama = conn('truefoundry_gateway', 'local_llama_provider');

    // Run AI routing optimization hook if provided
    if (aiRoutingHook) {
      aiRoutingHook(this);
    } else {
      // Default heuristic-based fallback routing
      const openaiFailoverActive = hasMitigation('failover', 'truefoundry_gateway');
      const openaiFailed = openai.status === 'critical' || openai.status === 'unstable';

      if (openaiFailed && openaiFailoverActive) {
        // Fallback sequence: OpenAI -> Anthropic (if healthy) -> Local Llama
        if (anthropic.status !== 'critical') {
          llmRouter.activeModel = 'claude-3-5-sonnet';
          openai.throughput = 0;
          connOpenai.load = 0;

          anthropic.throughput = agentRps;
          connAnthropic.load = agentRps;
          connAnthropic.status = 'active';

          localLlama.throughput = 0;
          connLlama.load = 0;
        } else {
          // Both failed, fallback to local
          llmRouter.activeModel = 'llama-3-8b-instruct';
          openai.throughput = 0;
          connOpenai.load = 0;

          anthropic.throughput = 0;
          connAnthropic.load = 0;

          localLlama.throughput = agentRps;
          connLlama.load = agentRps;
          connLlama.status = 'active';
        }
      } else {
        // Normal route to OpenAI
        llmRouter.activeModel = 'gpt-4o';
        openai.throughput = agentRps;
        connOpenai.load = agentRps;
        connOpenai.status = openaiFailed ? 'congested' : 'active';

        anthropic.throughput = 0;
        connAnthropic.load = 0;
        localLlama.throughput = 0;
        connLlama.load = 0;
      }
    }
  }

  private updateNodeResources(): void {
    const isIncident = (type: ChaosType) => this.activeChaosIncidents.some((c) => c.type === type);

    this.nodes.forEach((node) => {
      // Compute queue depth dynamics
      if (node.status === 'critical') {
        node.queueDepth = Math.min(node.queueDepth + Math.round(node.throughput * 0.4), node.maxQueueDepth);
      } else if (node.status === 'unstable') {
        node.queueDepth = Math.min(node.queueDepth + Math.round(node.throughput * 0.15), node.maxQueueDepth);
      } else {
        // Drain queue
        const drain = Math.round(this.getBaseLatency(node.id) > 0 ? (1000 / this.getBaseLatency(node.id)) * 5 : 50);
        node.queueDepth = Math.max(node.queueDepth - drain, 0);
      }

      // Compute CPU and memory loads based on throughput and queue
      const throughputFactor = node.throughput / this.targetThroughput;
      const queueFactor = node.queueDepth / node.maxQueueDepth;

      node.cpuUsage = Math.min(
        Math.round(
          node.cpuUsage +
          throughputFactor * 15 +
          queueFactor * 40
        ),
        100
      );

      node.memoryUsage = Math.min(
        Math.round(
          node.memoryUsage +
          throughputFactor * 10 +
          queueFactor * 30
        ),
        100
      );

      // Memory leak / token spikes can override this
      if (node.id === 'api_gateway' && isIncident('memory_overflow')) {
        node.memoryUsage = 99;
        node.cpuUsage = 98;
      }

      if (node.id === 'agent_executor' && isIncident('agent_deadlock')) {
        node.cpuUsage = 100;
        node.memoryUsage = Math.min(node.memoryUsage + 20, 96);
      }

      // If queue exceeds 95% capacity, node goes unstable or critical
      if (node.queueDepth >= node.maxQueueDepth && node.status !== 'critical') {
        node.status = 'critical';
        node.errorRate = 0.9;
        node.failureReason = 'Buffer queue allocation exhausted (Drop requests)';
      }
    });
  }

  private updateConnections(): void {
    this.connections.forEach((conn) => {
      const sourceNode = this.nodes.find((n) => n.id === conn.source)!;
      const targetNode = this.nodes.find((n) => n.id === conn.target)!;

      // Link status matches target or source failure profiles
      if (sourceNode.status === 'critical' || targetNode.status === 'critical') {
        conn.status = 'severed';
        conn.latency = 9999;
      } else if (sourceNode.status === 'unstable' || targetNode.status === 'unstable' || conn.load > this.targetThroughput * 1.5) {
        conn.status = 'congested';
        conn.latency = this.getBaseLatency(targetNode.id) * 0.5;
      } else {
        conn.status = 'active';
        conn.latency = 0;
      }
    });
  }

  private calculateSystemMetrics(): void {
    let cumulativeLatency = 0;
    let countedNodes = 0;
    let totalErrors = 0;
    let activeNodes = 0;

    // Follow the primary path: api_gateway -> semantic_router -> agent_executor -> (vector_db/mcp) -> truefoundry_gateway -> active llm
    const pathNodes = ['api_gateway', 'semantic_router', 'agent_executor'];

    // Vector DB and MCP are only counted if not circuit broken
    const isCircuitBrokenVdb = this.activeMitigations.some((m) => m.type === 'circuit_breaking' && m.nodeId === 'vector_db');
    const isDegradedAgent = this.activeMitigations.some((m) => m.type === 'degraded_mode' && m.nodeId === 'agent_executor');

    if (!isCircuitBrokenVdb) pathNodes.push('vector_db');
    if (!isDegradedAgent) pathNodes.push('mcp_server');

    pathNodes.push('truefoundry_gateway');

    // Add active LLM endpoint
    const llmRouter = this.nodes.find((n) => n.id === 'truefoundry_gateway')!;
    if (llmRouter.activeModel === 'gpt-4o') {
      pathNodes.push('openai_provider');
    } else if (llmRouter.activeModel === 'claude-3-5-sonnet') {
      pathNodes.push('anthropic_provider');
    } else {
      pathNodes.push('local_llama_provider');
    }

    pathNodes.forEach((nodeId) => {
      const node = this.nodes.find((n) => n.id === nodeId);
      if (node) {
        cumulativeLatency += node.latency;
        totalErrors += node.errorRate;
        countedNodes++;
        if (node.status === 'healthy') {
          activeNodes++;
        }
      }
    });

    const averageLatency = countedNodes > 0 ? Math.round(cumulativeLatency) : 0;
    const avgErrorRate = countedNodes > 0 ? totalErrors / countedNodes : 0.0;

    // Traffic volume
    const gateway = this.nodes.find((n) => n.id === 'api_gateway')!;
    const throughput = gateway.throughput; // total requests per second
    const failRps = throughput * avgErrorRate;
    const successRps = throughput * (1 - avgErrorRate);

    this.metrics.totalRequests += Math.round(throughput);
    this.metrics.successfulRequests += Math.round(successRps);
    this.metrics.failedRequests += Math.round(failRps);

    // Latency metrics
    this.metrics.averageLatency = averageLatency;

    // Uptime calculation (percentage of healthy path nodes)
    const instantUptime = (activeNodes / countedNodes) * 100;
    this.metrics.uptime = Number(
      ((this.metrics.uptime * (this.totalTicks - 1) + instantUptime) / this.totalTicks).toFixed(2)
    );

    // Cost dynamics: calculate cost of current throughput
    let stepCost = 0;
    this.nodes.forEach((node) => {
      if (node.throughput > 0 && node.cost > 0) {
        // Cost is given per 1k queries. Multiply by current throughput
        const compressionFactor = node.promptCompressionRatio; // compressed queries are cheaper
        stepCost += (node.throughput / 1000) * node.cost * compressionFactor;
      }
    });
    this.metrics.totalCost += stepCost;

    // Saved cost: calculate differences when compression or cheap models are running
    const originalLlmRps = gateway.throughput * 0.7; // standard agent routes to openai
    const defaultCostPerLlmReq = 0.015 / 1000;
    const standardLlmCost = originalLlmRps * defaultCostPerLlmReq;

    let actualLlmCost = 0;
    const openai = this.nodes.find((n) => n.id === 'openai_provider')!;
    const anthropic = this.nodes.find((n) => n.id === 'anthropic_provider')!;
    const localLlama = this.nodes.find((n) => n.id === 'local_llama_provider')!;

    actualLlmCost += (openai.throughput / 1000) * openai.cost * openai.promptCompressionRatio;
    actualLlmCost += (anthropic.throughput / 1000) * anthropic.cost * anthropic.promptCompressionRatio;
    actualLlmCost += (localLlama.throughput / 1000) * localLlama.cost * localLlama.promptCompressionRatio;

    if (standardLlmCost > actualLlmCost) {
      this.metrics.savedCost += (standardLlmCost - actualLlmCost);
    }

    // Dynamic Resilience Score Formulation
    // Built from: Uptime (40%), Error Rate (30%), Latency Penalty (20%), Overload/Queue Congestion Penalty (10%)
    let queuePenalty = 0;
    this.nodes.forEach((n) => {
      if (n.queueDepth > n.maxQueueDepth * 0.5) {
        queuePenalty += 2; // minor penalty for full queues
      }
    });

    const errorPenalty = avgErrorRate * 100;
    const latencyPenalty = averageLatency > 500 ? Math.min((averageLatency - 500) / 15, 20) : 0;
    const uptimePenalty = 100 - instantUptime;

    const baseResilience = 100 - (uptimePenalty * 0.4 + errorPenalty * 0.3 + latencyPenalty + queuePenalty);
    const stepResilience = Math.max(Math.min(Math.round(baseResilience), 100), 5);

    this.metrics.overallResilienceScore = stepResilience;

    // Recovery speed/efficiency
    // Based on whether we have active incidents vs active mitigations.
    if (this.activeChaosIncidents.length === 0) {
      this.metrics.recoveryEfficiency = 100;
    } else {
      const activeIncCount = this.activeChaosIncidents.length;
      const activeMitCount = this.activeMitigations.length;
      // Recovery efficiency ranges from 20% to 100% depending on how well we've covered our active incidents
      const coverage = Math.min(activeMitCount / activeIncCount, 1.0);
      this.metrics.recoveryEfficiency = Math.round(30 + coverage * 70);
    }
  }

  public getSnapshot(): SimulationSnapshot {
    return {
      timestamp: this.relativeTime,
      nodes: this.nodes.map((n) => ({ ...n })),
      connections: this.connections.map((c) => ({ ...c })),
      logs: [...this.logs],
      metrics: { ...this.metrics },
      activeMitigations: [...this.activeMitigations],
      activeChaosIncidents: [...this.activeChaosIncidents],
    };
  }
}
