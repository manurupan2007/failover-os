export type NodeStatus = 'healthy' | 'unstable' | 'critical' | 'recovering';

export type NodeType =
  | 'gateway'
  | 'router'
  | 'agent'
  | 'mcp'
  | 'cache'
  | 'vectorDB'
  | 'llm';

export interface NodeState {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  latency: number; // in ms
  throughput: number; // in requests per second (RPS)
  errorRate: number; // 0.0 to 1.0
  cost: number; // cost per 1k requests in USD
  queueDepth: number; // current request queue size
  maxQueueDepth: number; // queue capacity before dropping requests
  activeModel?: string; // relevant for routers and LLM nodes
  promptCompressionRatio: number; // 1.0 = none, <1.0 = compressed (e.g. 0.4 means context compressed to 40%)
  failureReason?: string;
  recoveryProgress: number; // 0 to 100 (%)
  cpuUsage: number; // percentage 0-100
  memoryUsage: number; // percentage 0-100
  region: string; // e.g. 'us-east-1', 'us-west-2', 'eu-central-1'
}

export type ConnectionStatus = 'active' | 'congested' | 'severed';

export interface ConnectionState {
  id: string;
  source: string;
  target: string;
  status: ConnectionStatus;
  latency: number; // link latency addition
  load: number; // RPS flowing through this link
}

export type LogType = 'info' | 'warning' | 'error' | 'success';
export type LogSource = 'simulation' | 'ai_predictor' | 'recovery_engine' | 'chaos_injector';

export interface LogEntry {
  id: string;
  timestamp: number; // relative simulation time in ms
  realTimestamp: string; // formatted system clock e.g. HH:MM:SS
  nodeId?: string;
  type: LogType;
  source: LogSource;
  message: string;
}

export interface SystemMetrics {
  uptime: number; // percentage 0-100
  overallResilienceScore: number; // 0-100
  averageLatency: number; // ms
  totalCost: number; // USD
  savedCost: number; // USD saved via routing optimization/compression
  recoveryEfficiency: number; // 0-100
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export type MitigationType =
  | 'failover'
  | 'circuit_breaking'
  | 'context_compression'
  | 'load_rebalancing'
  | 'degraded_mode';

export interface ActiveMitigation {
  id: string;
  name: string;
  nodeId: string;
  type: MitigationType;
  startedAt: number; // sim timestamp
  description: string;
  impactSummary: string;
}

export type ChaosType =
  | 'openai_outage'
  | 'claude_timeout'
  | 'vector_db_corruption'
  | 'mcp_server_crash'
  | 'token_spike'
  | 'rate_limit_failure'
  | 'retry_storm'
  | 'latency_spike'
  | 'memory_overflow'
  | 'queue_congestion'
  | 'agent_deadlock'
  | 'regional_outage'
  | 'token_flood'
  | 'latency_cascade';

export interface ChaosIncident {
  id: string;
  type: ChaosType;
  nodeId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number; // sim timestamp
  resolvedAt?: number;
}

export interface SimulationSnapshot {
  timestamp: number;
  nodes: NodeState[];
  connections: ConnectionState[];
  logs: LogEntry[];
  metrics: SystemMetrics;
  activeMitigations: ActiveMitigation[];
  activeChaosIncidents: ChaosIncident[];
}
