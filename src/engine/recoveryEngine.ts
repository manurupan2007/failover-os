import type { NodeState, ActiveMitigation, ChaosIncident, MitigationType } from './types';
import type { AnomalyReport, CascadePrediction } from './aiEngine';

export interface RecoveryPlan {
  id: string;
  name: string;
  targetNodeId: string;
  type: MitigationType;
  description: string;
  rationale: string;
  expectedOutcome: string;
  estimatedRecoverySpeed: 'instant' | 'fast' | 'moderate';
  costImpact: 'neutral' | 'increased' | 'decreased';
}

export class RecoveryEngine {
  public generateRecoveryPlan(
    nodes: NodeState[],
    _anomalies: AnomalyReport[],
    _predictions: CascadePrediction[],
    activeIncidents: ChaosIncident[],
    activeMitigations: ActiveMitigation[]
  ): RecoveryPlan[] {
    const plans: RecoveryPlan[] = [];
    const isMitigated = (type: MitigationType, nodeId: string) =>
      activeMitigations.some((m) => m.type === type && m.nodeId === nodeId);

    // 1. Check for OpenAI Outage or Rate Limits -> Propose Inference Failover
    const openaiOutage = activeIncidents.some((c) => c.type === 'openai_outage' || c.type === 'rate_limit_failure');
    const openaiRouter = nodes.find((n) => n.id === 'truefoundry_gateway');

    if (openaiOutage && openaiRouter && !isMitigated('failover', 'truefoundry_gateway')) {
      plans.push({
        id: 'plan_fo_llm',
        name: 'Automated Inference Failover',
        targetNodeId: 'truefoundry_gateway',
        type: 'failover',
        description: 'Redirect LLM request traffic away from OpenAI and establish connection with Anthropic API / Llama-3 nodes.',
        rationale: 'Primary LLM API experiencing critical service blackout. Upstream fallbacks are healthy and responsive.',
        expectedOutcome: 'Restores LLM availability immediately. Bypasses 503 failures, shifting latency back under SLA thresholds.',
        estimatedRecoverySpeed: 'instant',
        costImpact: 'increased', // Anthropic sonnet is more expensive than standard GPT-4o-mini, or local Llama is cheap but we might use Claude
      });
    }

    // 2. Check for OpenAI Latency Spike or Rate Limit -> Propose Prompt Context Compression
    const hasTokenOrRateLimit = activeIncidents.some(
      (c) => c.type === 'token_spike' || c.type === 'rate_limit_failure' || c.type === 'latency_spike'
    );
    if (hasTokenOrRateLimit && openaiRouter && !isMitigated('context_compression', 'truefoundry_gateway')) {
      plans.push({
        id: 'plan_cc_llm',
        name: 'Context Compression Protocol',
        targetNodeId: 'truefoundry_gateway',
        type: 'context_compression',
        description: 'Compress active prompt templates by 60% using system summary instructions before sending to LLM API.',
        rationale: 'High token pressure or rate-limiting detected. Reducing payload size directly scales down costs and transit time.',
        expectedOutcome: 'Decreases upstream latency by 30%, reduces token consumption cost, and bypasses 429 rate throttles.',
        estimatedRecoverySpeed: 'fast',
        costImpact: 'decreased',
      });
    }

    // 3. Check for Vector DB Corruption -> Propose Vector DB Circuit Breaking
    const vectorDbIncident = activeIncidents.some((c) => c.type === 'vector_db_corruption');
    const vectorDbNode = nodes.find((n) => n.id === 'vector_db');
    if (vectorDbIncident && vectorDbNode && !isMitigated('circuit_breaking', 'vector_db')) {
      plans.push({
        id: 'plan_cb_vdb',
        name: 'Database Isolation (Circuit Breaker)',
        targetNodeId: 'vector_db',
        type: 'circuit_breaking',
        description: 'Open the circuit breaker on Vector DB requests. Route retrievals to local cache or stub results.',
        rationale: 'Pinecone Vector DB is corrupt, throwing high rates of failures and adding transit query latencies.',
        expectedOutcome: 'Prevents database crash propagation to Agent Executor. Latency spikes and memory congestion are blocked.',
        estimatedRecoverySpeed: 'instant',
        costImpact: 'neutral',
      });
    }

    // 4. Check for MCP Server Crash or Vector DB Corruption -> Propose Degraded Mode on Agent
    const mcpIncident = activeIncidents.some((c) => c.type === 'mcp_server_crash');
    const agentNode = nodes.find((n) => n.id === 'agent_executor');

    if ((mcpIncident || vectorDbIncident) && agentNode && !isMitigated('degraded_mode', 'agent_executor')) {
      plans.push({
        id: 'plan_dm_agent',
        name: 'Degraded Agent Operations Mode',
        targetNodeId: 'agent_executor',
        type: 'degraded_mode',
        description: 'Bypass advanced external tools and heavy vector lookups; substitute with static cache fallbacks.',
        rationale: 'Downstream agent utilities are crashed or timed out. Degraded mode allows the core conversation engine to persist.',
        expectedOutcome: 'Core client UI remains responsive. Core agent executes mock tool results instead of raising fatal stack traces.',
        estimatedRecoverySpeed: 'fast',
        costImpact: 'decreased',
      });
    }

    // 5. Check for Retry Storm or Gateway Memory Overflow -> Propose Circuit Breaking at semantic router
    const retryStormIncident = activeIncidents.some((c) => c.type === 'retry_storm' || c.type === 'memory_overflow');
    const semanticRouterNode = nodes.find((n) => n.id === 'semantic_router');

    if (retryStormIncident && semanticRouterNode && !isMitigated('circuit_breaking', 'semantic_router')) {
      plans.push({
        id: 'plan_cb_router',
        name: 'Retry Storm Suppression Shield',
        targetNodeId: 'semantic_router',
        type: 'circuit_breaking',
        description: 'Temporarily throttle and queue incoming requests at the API Gateway. Add 500ms jitter delay to retry loops.',
        rationale: 'Uncontrolled retry cycles are overloading the orchestration layer, leading to gateway crashes.',
        expectedOutcome: 'Relieves heap pressure on the API Gateway, preventing outright process crashes. System queue drains.',
        estimatedRecoverySpeed: 'moderate',
        costImpact: 'neutral',
      });
    }

    // 6. Check for general high CPU/Memory or queue depths -> Propose Load Rebalancing
    const highLoad = nodes.some((n) => n.status === 'unstable' && n.queueDepth > n.maxQueueDepth * 0.7);

    if (highLoad && !isMitigated('load_rebalancing', 'api_gateway')) {
      plans.push({
        id: 'plan_lr_gw',
        name: 'Dynamic Load Rebalancing',
        targetNodeId: 'api_gateway',
        type: 'load_rebalancing',
        description: 'Rebalance request loads across us-west-2 and eu-central-1 mirror regions.',
        rationale: 'High thread pool contention and queue depths in us-east-1 gateways.',
        expectedOutcome: 'Decreases queue depth by 50% across overloaded nodes and normalizes operational latency.',
        estimatedRecoverySpeed: 'moderate',
        costImpact: 'neutral',
      });
    }

    return plans;
  }
}
