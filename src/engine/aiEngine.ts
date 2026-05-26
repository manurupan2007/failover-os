import type { NodeState, ConnectionState, SimulationSnapshot } from './types';

export interface AnomalyReport {
  nodeId: string;
  anomalyScore: number; // 0 to 100
  status: 'nominal' | 'warning' | 'critical';
  metricsAlerting: string[];
}

export interface CascadePrediction {
  nodeId: string;
  sourceNodeId: string;
  probability: number; // 0.0 to 1.0
  timeToOutageSeconds: number;
  criticalPath: string[];
  reason: string;
}

export interface AIEngineState {
  anomalies: AnomalyReport[];
  predictions: CascadePrediction[];
  overallSystemHealth: number; // 0 to 100
}

export class AIEngine {
  private history: SimulationSnapshot[] = [];
  private maxHistoryLength = 20;

  public updateHistory(snapshot: SimulationSnapshot): void {
    this.history.unshift(snapshot);
    if (this.history.length > this.maxHistoryLength) {
      this.history.pop();
    }
  }

  public analyze(nodes: NodeState[], connections: ConnectionState[]): AIEngineState {
    const anomalies = this.detectAnomalies(nodes);
    const predictions = this.predictCascadingFailures(nodes, connections);

    // Calculate overall system health index (0 to 100)
    let totalScore = 0;
    nodes.forEach((n) => {
      let nodeScore = 100;
      if (n.status === 'critical') nodeScore = 15;
      else if (n.status === 'unstable') nodeScore = 55;
      else if (n.status === 'recovering') nodeScore = 75;

      // Penalize for error rates, queue depths, memory, and CPU limits
      nodeScore -= n.errorRate * 40;
      nodeScore -= (n.queueDepth / n.maxQueueDepth) * 30;
      if (n.cpuUsage > 90) nodeScore -= 10;
      if (n.memoryUsage > 90) nodeScore -= 15;

      totalScore += Math.max(nodeScore, 0);
    });

    const overallSystemHealth = Math.round(totalScore / nodes.length);

    return {
      anomalies,
      predictions,
      overallSystemHealth,
    };
  }

  private detectAnomalies(nodes: NodeState[]): AnomalyReport[] {
    return nodes.map((node) => {
      const metricsAlerting: string[] = [];
      let anomalyScore = 0;

      // 1. Error rate check
      if (node.errorRate > 0.05) {
        anomalyScore += node.errorRate * 40;
        metricsAlerting.push(`High Error Rate (${Math.round(node.errorRate * 100)}%)`);
      }

      // 2. Queue Depth check
      const queueRatio = node.queueDepth / node.maxQueueDepth;
      if (queueRatio > 0.3) {
        anomalyScore += queueRatio * 30;
        metricsAlerting.push(`Queue Saturation (${Math.round(queueRatio * 100)}%)`);
      }

      // 3. Resource Usage check
      if (node.cpuUsage > 85) {
        anomalyScore += 15;
        metricsAlerting.push(`CPU Core Starvation (${node.cpuUsage}%)`);
      }
      if (node.memoryUsage > 85) {
        anomalyScore += 15;
        metricsAlerting.push(`Memory Ceiling Pressure (${node.memoryUsage}%)`);
      }

      // Cap at 100
      anomalyScore = Math.min(Math.round(anomalyScore), 100);

      let status: AnomalyReport['status'] = 'nominal';
      if (anomalyScore > 65 || node.status === 'critical') {
        status = 'critical';
      } else if (anomalyScore > 25 || node.status === 'unstable') {
        status = 'warning';
      }

      return {
        nodeId: node.id,
        anomalyScore,
        status,
        metricsAlerting,
      };
    });
  }

  private predictCascadingFailures(
    nodes: NodeState[],
    connections: ConnectionState[]
  ): CascadePrediction[] {
    const predictions: CascadePrediction[] = [];

    // Find all currently failing/critical nodes
    const failingNodes = nodes.filter((n) => n.status === 'critical' || n.status === 'unstable');

    failingNodes.forEach((failNode) => {
      // Traverse downstream connections to predict propagation
      const visited = new Set<string>();
      const queue: { nodeId: string; path: string[]; currentProb: number }[] = [
        { nodeId: failNode.id, path: [failNode.id], currentProb: 1.0 },
      ];

      while (queue.length > 0) {
        const { nodeId, path, currentProb } = queue.shift()!;
        visited.add(nodeId);

        // Find downstream connections
        const downstreamConns = connections.filter((c) => c.source === nodeId && c.status !== 'severed');

        downstreamConns.forEach((conn) => {
          if (visited.has(conn.target)) return;

          const targetNode = nodes.find((n) => n.id === conn.target)!;

          // Compute risk of failure propagating to target
          let propagationProb = 0.0;
          let timeToOutage = 15; // default 15s

          if (failNode.id === 'openai_provider') {
            if (targetNode.id === 'truefoundry_gateway') {
              propagationProb = 0.98;
              timeToOutage = 4;
            } else if (targetNode.id === 'agent_executor') {
              propagationProb = 0.90;
              timeToOutage = 8;
            } else if (targetNode.id === 'api_gateway') {
              propagationProb = 0.75;
              timeToOutage = 12;
            }
          } else if (failNode.id === 'vector_db') {
            if (targetNode.id === 'agent_executor') {
              propagationProb = 0.85;
              timeToOutage = 6;
            } else if (targetNode.id === 'api_gateway') {
              propagationProb = 0.55;
              timeToOutage = 12;
            }
          } else if (failNode.id === 'mcp_server') {
            if (targetNode.id === 'agent_executor') {
              propagationProb = 0.70;
              timeToOutage = 10;
            }
          } else {
            // General connection overload propagation
            if (conn.status === 'congested') {
              propagationProb = 0.65;
              timeToOutage = 15;
            }
          }

          const finalProb = currentProb * propagationProb;

          if (finalProb > 0.3 && targetNode.status === 'healthy') {
            let reason = `Target downstream of unstable service [${failNode.name}]. Connection load transfer.`;
            if (failNode.id === 'openai_provider') {
              reason = 'Unmitigated LLM outage causing queue blockages and request timeouts.';
            } else if (failNode.id === 'vector_db') {
              reason = 'Database read/write corruption stalling agent execution loops.';
            } else if (failNode.id === 'mcp_server') {
              reason = 'MCP Tool failure causing tool dependency stalling.';
            }

            predictions.push({
              nodeId: targetNode.id,
              sourceNodeId: failNode.id,
              probability: Number(finalProb.toFixed(2)),
              timeToOutageSeconds: timeToOutage,
              criticalPath: [...path, targetNode.id],
              reason,
            });

            // Enqueue target to continue checking cascading flow
            queue.push({
              nodeId: targetNode.id,
              path: [...path, targetNode.id],
              currentProb: finalProb,
            });
          }
        });
      }
    });

    return predictions;
  }

  // AI Router Optimization: Calculates dynamic weights based on real-time cost, latency, and node health.
  // Returns the target model and distribution parameters.
  public getOptimizedRouting(nodes: NodeState[]): {
    bestModel: string;
    weights: { openai: number; anthropic: number; local: number };
    rationale: string;
  } {
    const openai = nodes.find((n) => n.id === 'openai_provider')!;
    const anthropic = nodes.find((n) => n.id === 'anthropic_provider')!;
    const local = nodes.find((n) => n.id === 'local_llama_provider')!;

    const getScore = (n: NodeState) => {
      if (n.status === 'critical') return -9999;
      if (n.status === 'unstable') return 10;
      if (n.status === 'recovering') return 35;

      // Score formula: balance Latency (30%), Cost (40%), Reliability (30%)
      const reliabilityScore = (1 - n.errorRate) * 100;
      const latencyScore = Math.max(100 - (n.latency / 10), 0); // lower latency is better
      const costScore = Math.max(100 - (n.cost * 3000), 0); // lower cost is better

      return reliabilityScore * 0.3 + latencyScore * 0.3 + costScore * 0.4;
    };

    const oScore = getScore(openai);
    const aScore = getScore(anthropic);
    const lScore = getScore(local);

    // Default to OpenAI
    let bestModel = 'gpt-4o';
    let rationale = 'OpenAI API provides optimal latency-cost ratio in normal conditions.';
    let weights = { openai: 1.0, anthropic: 0.0, local: 0.0 };

    if (oScore >= aScore && oScore >= lScore && oScore > 0) {
      weights = { openai: 1.0, anthropic: 0.0, local: 0.0 };
      bestModel = 'gpt-4o';
      rationale = 'OpenAI API is running optimally. Standard routing profile.';
    } else if (aScore >= oScore && aScore >= lScore && aScore > 0) {
      weights = { openai: 0.0, anthropic: 1.0, local: 0.0 };
      bestModel = 'claude-3-5-sonnet';
      rationale = 'OpenAI API degraded. Claude API is selected for premium failover recovery.';
    } else if (lScore > 0) {
      weights = { openai: 0.0, anthropic: 0.0, local: 1.0 };
      bestModel = 'llama-3-8b-instruct';
      rationale = 'Upstream cloud providers unavailable. Hard failover to Local Llama Edge nodes.';
    } else {
      weights = { openai: 0.0, anthropic: 0.0, local: 0.0 };
      bestModel = 'offline';
      rationale = 'All LLM execution providers are down. System offline.';
    }

    return { bestModel, weights, rationale };
  }
}
