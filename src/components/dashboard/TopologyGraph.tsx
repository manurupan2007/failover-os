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
    const size = 20;
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
    let fill = 'fill-slate-950/90';
    let stroke = 'stroke-slate-700';
    let textColor = 'text-slate-400';
    let filterId = '';

    switch (status) {
      case 'healthy':
        fill = 'fill-[#090d16]';
        stroke = isSelected ? 'stroke-emerald-400' : 'stroke-emerald-500/80';
        textColor = 'text-emerald-400';
        if (isSelected) filterId = 'glow-emerald';
        break;
      case 'unstable':
        fill = 'fill-[#0f1411]';
        stroke = isSelected ? 'stroke-amber-400' : 'stroke-amber-500/80 animate-pulse';
        textColor = 'text-amber-400';
        if (isSelected) filterId = 'glow-amber';
        break;
      case 'critical':
        fill = 'fill-[#1a0f0f]';
        stroke = isSelected ? 'stroke-rose-400' : 'stroke-rose-500/80';
        textColor = 'text-rose-400';
        if (isSelected) filterId = 'glow-rose';
        break;
      case 'recovering':
        fill = 'fill-[#091316]';
        stroke = isSelected ? 'stroke-cyan-400' : 'stroke-cyan-500/80';
        textColor = 'text-cyan-400';
        if (isSelected) filterId = 'glow-cyan';
        break;
    }

    return { fill, stroke, textColor, filterId };
  };

  // Generate cubic bezier paths for connections
  const paths = useMemo(() => {
    return connections.map((conn) => {
      const from = NODE_LAYOUTS[conn.source];
      const to = NODE_LAYOUTS[conn.target];
      if (!from || !to) return null;

      // Draw horizontal bezier or vertical curve based on coordinates
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      
      let pathData = '';
      if (Math.abs(dy) < 30) {
        // Mostly horizontal connection
        const cx1 = from.x + dx * 0.4;
        const cy1 = from.y;
        const cx2 = from.x + dx * 0.6;
        const cy2 = to.y;
        pathData = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
      } else {
        // S-curve connection
        const cx1 = from.x + dx * 0.5;
        const cy1 = from.y;
        const cx2 = from.x + dx * 0.5;
        const cy2 = to.y;
        pathData = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
      }

      // Color and line styles based on link status
      let strokeColor = 'stroke-slate-700/60';
      let strokeDash = '';
      let particleSpeed = '4s';
      let particleColor = '#10b981'; // green
      let particleCount = conn.load > 0 ? Math.min(Math.max(Math.round(conn.load / 8), 1), 5) : 0;
      let flickerClass = '';

      if (conn.status === 'severed') {
        strokeColor = 'stroke-rose-600/70';
        strokeDash = '6,4';
        particleCount = 0;
        flickerClass = 'animate-flicker';
      } else if (conn.status === 'congested') {
        strokeColor = 'stroke-amber-500/80';
        particleSpeed = '9s'; // slow flow
        particleColor = '#f59e0b'; // amber
        flickerClass = 'animate-flicker';
      } else {
        // active/healthy
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
        flickerClass,
      };
    });
  }, [connections]);

  return (
    <div className="relative w-full h-[410px] bg-[#090d16] rounded-xl border border-slate-800/80 overflow-hidden shadow-inner select-none">
      {/* Background Matrix-like Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:30px_30px] opacity-35" />
      
      {/* Grid Scanline Scan Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent h-[150%] w-full -translate-y-full animate-[scan_8s_linear_infinite] pointer-events-none" />

      {/* SVG canvas */}
      <svg className="absolute inset-0 w-full h-full p-2 z-10" viewBox="0 0 800 410" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-amber" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-rose" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Connections Layer */}
        {paths.map((path, idx) => {
          if (!path) return null;
          return (
            <g key={path.id || idx}>
              {/* Path glow backdrop */}
              <path
                d={path.pathData}
                fill="none"
                className={`${path.strokeColor} ${path.flickerClass || ''} transition-all duration-700`}
                strokeWidth={path.status === 'severed' ? 1.5 : 2}
                strokeDasharray={path.strokeDash}
              />
              
              {/* Request particle animation */}
              {Array.from({ length: path.particleCount }).map((_, i) => (
                <circle key={i} r="2.5" fill={path.particleColor}>
                  <animateMotion
                    dur={path.particleSpeed}
                    repeatCount="indefinite"
                    path={path.pathData}
                    begin={`${(i * 0.8).toFixed(1)}s`}
                  />
                </circle>
              ))}
            </g>
          );
        })}

        {/* Rendering interactive Node visual anchors */}
        {nodes.map((node) => {
          const layout = NODE_LAYOUTS[node.id];
          if (!layout) return null;

          const isSelected = selectedNodeId === node.id;
          const colors = getNodeColors(node.status, isSelected);
          const jitterClass = node.status === 'critical'
            ? 'animate-jitter-critical'
            : node.status === 'unstable'
            ? 'animate-jitter-unstable'
            : '';

          return (
            <g
              key={node.id}
              transform={`translate(${layout.x}, ${layout.y})`}
              className={`cursor-pointer group ${jitterClass}`}
              onClick={() => onSelectNode(node.id)}
            >
              {/* Recovery cyan scan ring */}
              {node.status === 'recovering' && (
                <circle
                  r="24"
                  className="fill-none stroke-cyan-500/50 stroke-1 animate-ping"
                />
              )}

              {/* Critical warning ring */}
              {node.status === 'critical' && (
                <circle
                  r="26"
                  className="fill-none stroke-rose-500/45 stroke-2 animate-ping"
                />
              )}

              {/* Glowing visual backdrop ring for failures */}
              {node.status === 'critical' && (
                <circle
                  r="22"
                  className="fill-rose-500/10 stroke-rose-500/20 stroke-[3px] glow-rose-pulse"
                />
              )}
              {node.status === 'unstable' && (
                <circle
                  r="22"
                  className="fill-amber-500/5 stroke-amber-500/25 stroke-[2px] glow-amber-pulse"
                />
              )}

              {/* Glowing circular node base */}
              <circle
                r="18"
                className={`transition-all duration-300 ${colors.fill}`}
              />

              {/* Core interactive node ring */}
              <circle
                r="18"
                className={`fill-none stroke-2 transition-all duration-300 ${colors.stroke} ${isSelected ? 'scale-105' : ''}`}
                filter={colors.filterId ? `url(#${colors.filterId})` : undefined}
              />

              {/* Icon Container */}
              <foreignObject x="-10" y="-10" width="20" height="20" className="pointer-events-none">
                <div className={`flex items-center justify-center w-full h-full transition-colors duration-300 ${colors.textColor}`}>
                  {getNodeIcon(node.type)}
                </div>
              </foreignObject>

              {/* Regional tag indicator */}
              {node.region !== 'us-east-1' && (
                <text
                  x="0"
                  y="-24"
                  textAnchor="middle"
                  className="text-[8px] font-mono fill-cyan-400 opacity-80"
                >
                  {node.region}
                </text>
              )}

              {/* Node Title */}
              <text
                x="0"
                y="30"
                textAnchor="middle"
                className={`text-[10px] font-mono font-medium tracking-wide transition-all ${
                  isSelected 
                    ? 'fill-white font-bold scale-105' 
                    : 'fill-slate-400 group-hover:fill-slate-200'
                }`}
              >
                {node.name}
              </text>

              {/* Node Telemetry metrics overlay (mini text) */}
              <text
                x="0"
                y="41"
                textAnchor="middle"
                className={`text-[8px] font-mono opacity-80 ${
                  node.status === 'critical' 
                    ? 'fill-rose-400 font-bold' 
                    : node.status === 'unstable'
                    ? 'fill-amber-400'
                    : 'fill-slate-500'
                }`}
              >
                {node.status === 'critical' 
                  ? 'CRASH' 
                  : `${Math.round(node.throughput)} RPS / ${node.latency}ms`}
              </text>

              {/* LLM Active model tooltip */}
              {node.type === 'llm' && node.throughput > 0 && (
                <g transform="translate(0, -32)">
                  <rect
                    x="-40"
                    y="-8"
                    width="80"
                    height="14"
                    rx="3"
                    className="fill-slate-900 border border-emerald-500/30"
                  />
                  <text
                    textAnchor="middle"
                    className="text-[7px] font-mono fill-emerald-400"
                    y="1"
                  >
                    {node.activeModel || 'GPT-4o'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend & HUD Details overlay */}
      <div className="absolute bottom-3 left-4 z-20 flex space-x-3 bg-slate-900/95 border border-slate-800/80 px-2.5 py-1.5 rounded-lg backdrop-blur-md">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
          <span className="text-[9px] font-mono text-slate-400">Healthy</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_#f59e0b]" />
          <span className="text-[9px] font-mono text-slate-400">Unstable</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_5px_#ef4444] animate-pulse" />
          <span className="text-[9px] font-mono text-slate-400">Critical</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />
          <span className="text-[9px] font-mono text-slate-400">Recovering</span>
        </div>
      </div>

      {/* Connection lines speed scale legend */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center space-x-1 bg-slate-900/95 border border-slate-800/80 px-2.5 py-1.5 rounded-lg backdrop-blur-md">
        <Activity size={10} className="text-emerald-400" />
        <span className="text-[9px] font-mono text-slate-400">Traffic load metrics scale based on actual RPS</span>
      </div>
    </div>
  );
};
export default TopologyGraph;
