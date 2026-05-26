import React, { useMemo } from 'react';
import type { NodeState, ConnectionState } from '../../engine/types';
import {
  Server,
  Cpu,
  Database,
  Terminal,
  Activity,
  Layers,
  Network,
} from 'lucide-react';

interface TopologyGraphProps {
  nodes: NodeState[];
  connections: ConnectionState[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

// Node coordinate map for graph layout
export const NODE_LAYOUTS: Record<string, { x: number; y: number; labelOffset: 'top' | 'bottom' | 'left' | 'right' }> = {
  api_gateway: { x: 70, y: 200, labelOffset: 'top' },
  semantic_router: { x: 210, y: 200, labelOffset: 'top' },
  prompt_cache: { x: 210, y: 70, labelOffset: 'left' },
  agent_executor: { x: 370, y: 200, labelOffset: 'top' },
  vector_db: { x: 370, y: 70, labelOffset: 'right' },
  mcp_server: { x: 370, y: 330, labelOffset: 'bottom' },
  truefoundry_gateway: { x: 530, y: 200, labelOffset: 'top' },
  openai_provider: { x: 700, y: 90, labelOffset: 'right' },
  anthropic_provider: { x: 700, y: 200, labelOffset: 'right' },
  local_llama_provider: { x: 700, y: 310, labelOffset: 'right' },
};

export const TopologyGraph: React.FC<TopologyGraphProps> = ({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
}) => {
  // Helper to resolve node icon based on type
  const getNodeIcon = (type: string) => {
    const size = 18;
    const baseClass = `transition-transform duration-300`;
    
    switch (type) {
      case 'gateway':
        return <Network size={size} className={baseClass} />;
      case 'router':
        return <Layers size={size} className={baseClass} />;
      case 'agent':
        return <Cpu size={size} className={baseClass} />;
      case 'mcp':
        return <Terminal size={size} className={baseClass} />;
      case 'cache':
        return <Database size={size} className={baseClass} />;
      case 'vectorDB':
        return <Database size={size} className={baseClass} />;
      case 'llm':
        return <Server size={size} className={baseClass} />;
      default:
        return <Activity size={size} className={baseClass} />;
    }
  };

  // Helper to color nodes based on status
  const getNodeColors = (status: NodeState['status'], isSelected: boolean) => {
    let fill = 'fill-slate-900';
    let stroke = isSelected ? 'stroke-indigo-400' : 'stroke-slate-700';
    let textColor = 'text-slate-400';

    switch (status) {
      case 'healthy':
        fill = 'fill-slate-900';
        stroke = isSelected ? 'stroke-emerald-400 stroke-2' : 'stroke-emerald-500/70';
        textColor = 'text-emerald-450';
        break;
      case 'unstable':
        fill = 'fill-slate-900';
        stroke = isSelected ? 'stroke-amber-400 stroke-2' : 'stroke-amber-500/80';
        textColor = 'text-amber-450';
        break;
      case 'critical':
        fill = 'fill-slate-900';
        stroke = isSelected ? 'stroke-rose-400 stroke-2' : 'stroke-rose-500/80';
        textColor = 'text-rose-450';
        break;
      case 'recovering':
        fill = 'fill-slate-900';
        stroke = isSelected ? 'stroke-cyan-400 stroke-2' : 'stroke-cyan-500/80';
        textColor = 'text-cyan-455';
        break;
    }

    return { fill, stroke, textColor };
  };

  // Generate cubic bezier paths for connections
  const paths = useMemo(() => {
    return connections.map((conn) => {
      const from = NODE_LAYOUTS[conn.source];
      const to = NODE_LAYOUTS[conn.target];
      if (!from || !to) return null;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      
      let pathData = '';
      if (Math.abs(dy) < 30) {
        const cx1 = from.x + dx * 0.4;
        const cy1 = from.y;
        const cx2 = from.x + dx * 0.6;
        const cy2 = to.y;
        pathData = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
      } else {
        const cx1 = from.x + dx * 0.5;
        const cy1 = from.y;
        const cx2 = from.x + dx * 0.5;
        const cy2 = to.y;
        pathData = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
      }

      // Color and line styles based on link status
      let strokeColor = 'stroke-slate-800';
      let strokeDash = '';
      let particleSpeed = '4s';
      let particleColor = '#10b981'; // green
      let particleCount = conn.load > 0 ? Math.min(Math.max(Math.round(conn.load / 10), 1), 4) : 0;

      if (conn.status === 'severed') {
        strokeColor = 'stroke-rose-950/80';
        strokeDash = '4,4';
        particleCount = 0;
      } else if (conn.status === 'congested') {
        strokeColor = 'stroke-amber-600/60';
        particleSpeed = '8s'; // slow flow
        particleColor = '#f59e0b'; // amber
      } else {
        if (conn.load > 30) {
          particleSpeed = '2.5s'; // faster flow
        }
      }

      return {
        id: conn.id,
        pathData,
        strokeColor,
        strokeDash,
        particleColor,
        particleSpeed,
        particleCount,
        load: conn.load,
        status: conn.status,
      };
    });
  }, [connections]);

  return (
    <div className="relative w-full h-[410px] bg-slate-950 rounded-xl border border-slate-900 overflow-hidden select-none">
      {/* Background Subtle Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

      {/* SVG canvas */}
      <svg className="absolute inset-0 w-full h-full p-2 z-10" viewBox="0 0 800 410" preserveAspectRatio="xMidYMid meet">
        {/* Connections Layer */}
        {paths.map((path, idx) => {
          if (!path) return null;
          return (
            <g key={path.id || idx}>
              <path
                d={path.pathData}
                fill="none"
                className={`${path.strokeColor} transition-colors duration-500`}
                strokeWidth={path.status === 'severed' ? 1.5 : 2}
                strokeDasharray={path.strokeDash}
              />
              
              {/* Request particle animation */}
              {Array.from({ length: path.particleCount }).map((_, i) => (
                <circle key={i} r="2" fill={path.particleColor} className="opacity-80">
                  <animateMotion
                    dur={path.particleSpeed}
                    repeatCount="indefinite"
                    path={path.pathData}
                    begin={`${(i * 1.0).toFixed(1)}s`}
                  />
                </circle>
              ))}
            </g>
          );
        })}

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const layout = NODE_LAYOUTS[node.id];
          if (!layout) return null;

          const isSelected = selectedNodeId === node.id;
          const colors = getNodeColors(node.status, isSelected);

          return (
            <g
              key={node.id}
              transform={`translate(${layout.x}, ${layout.y})`}
              className="cursor-pointer group"
              onClick={() => onSelectNode(node.id)}
            >
              {/* Node status ring */}
              {node.status !== 'healthy' && (
                <circle
                  r="22"
                  className={`fill-none stroke-1 opacity-40 ${
                    node.status === 'critical'
                      ? 'stroke-rose-500'
                      : node.status === 'unstable'
                      ? 'stroke-amber-500'
                      : 'stroke-cyan-500'
                  }`}
                />
              )}

              {/* Node Base Circle */}
              <circle
                r="16"
                className={`transition-all duration-300 ${colors.fill} ${colors.stroke}`}
              />

              {/* Icon Container */}
              <foreignObject x="-9" y="-9" width="18" height="18" className="pointer-events-none">
                <div className={`flex items-center justify-center w-full h-full transition-colors duration-300 ${colors.textColor}`}>
                  {getNodeIcon(node.type)}
                </div>
              </foreignObject>

              {/* Regional tag indicator */}
              {node.region !== 'us-east-1' && (
                <text
                  x="0"
                  y="-22"
                  textAnchor="middle"
                  className="text-[8px] font-mono fill-slate-500 font-medium"
                >
                  {node.region}
                </text>
              )}

              {/* Node Title */}
              <text
                x="0"
                y="28"
                textAnchor="middle"
                className={`text-[9.5px] font-mono font-medium tracking-wide transition-colors ${
                  isSelected 
                    ? 'fill-slate-100 font-semibold' 
                    : 'fill-slate-400 group-hover:fill-slate-200'
                }`}
              >
                {node.name}
              </text>

              {/* Node Telemetry metrics overlay */}
              <text
                x="0"
                y="38"
                textAnchor="middle"
                className={`text-[8px] font-mono ${
                  node.status === 'critical' 
                    ? 'fill-rose-450 font-bold' 
                    : node.status === 'unstable'
                    ? 'fill-amber-450'
                    : 'fill-slate-500'
                }`}
              >
                {node.status === 'critical' 
                  ? 'OFFLINE' 
                  : `${Math.round(node.throughput)} RPS / ${node.latency}ms`}
              </text>

              {/* LLM Active model tooltip */}
              {node.type === 'llm' && node.throughput > 0 && (
                <g transform="translate(0, -30)">
                  <rect
                    x="-36"
                    y="-7"
                    width="72"
                    height="13"
                    rx="3"
                    className="fill-slate-900 stroke-slate-800"
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    className="text-[7px] font-mono fill-emerald-400 font-medium"
                    y="1.5"
                  >
                    {node.activeModel || 'GPT-4o'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend & Details Overlay */}
      <div className="absolute bottom-3 left-4 z-20 flex space-x-3 bg-slate-900 border border-slate-800/80 px-2.5 py-1.5 rounded-lg">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-mono text-slate-400">Healthy</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[9px] font-mono text-slate-400">Unstable</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-[9px] font-mono text-slate-400">Critical</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-[9px] font-mono text-slate-400">Recovering</span>
        </div>
      </div>

      {/* Speed Legend */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center space-x-1.5 bg-slate-900 border border-slate-800/80 px-2.5 py-1.5 rounded-lg">
        <Activity size={10} className="text-slate-450" />
        <span className="text-[9px] font-mono text-slate-400">Real-time traffic load monitoring</span>
      </div>
    </div>
  );
};

export default TopologyGraph;
