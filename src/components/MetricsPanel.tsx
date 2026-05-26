import React, { useMemo } from 'react';
import type { SystemMetrics } from '../engine/types';
import { Activity, Clock, ShieldCheck, DollarSign } from 'lucide-react';

interface MetricsPanelProps {
  metrics: SystemMetrics;
  history: SystemMetrics[];
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics, history }) => {
  // Helper to build SVG paths for historical trends
  const renderSparkline = (data: number[], color: string, id: string, minVal?: number, maxVal?: number) => {
    if (data.length < 2) return null;

    const width = 140;
    const height = 45;
    const padding = 2;

    const min = minVal !== undefined ? minVal : Math.min(...data);
    const max = maxVal !== undefined ? maxVal : Math.max(...data);
    const range = max - min || 1;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - min) / range) * (height - padding * 2) - padding;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const fillPoints = `${padding},${height} ${points} ${width - padding},${height}`;

    return (
      <svg className="w-[140px] h-[45px]">
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon points={fillPoints} fill={`url(#grad-${id})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" />
      </svg>
    );
  };

  // Extract history arrays
  const latencyHistory = useMemo(() => history.map((h) => h.averageLatency).slice(-20), [history]);
  const resilienceHistory = useMemo(() => history.map((h) => h.overallResilienceScore).slice(-20), [history]);
  const costHistory = useMemo(() => history.map((h) => h.totalCost).slice(-20), [history]);
  const failedRequestsHistory = useMemo(() => history.map((h) => h.failedRequests).slice(-20), [history]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
      {/* 1. Resilience Score */}
      <div className="relative overflow-hidden bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-[115px] shadow-lg group hover:border-cyan-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 tracking-wider">RESILIENCE SCORE</span>
          <ShieldCheck size={16} className="text-cyan-400" />
        </div>
        <div className="flex items-end justify-between mt-2 z-10">
          <div>
            <h2 className="text-3xl font-mono font-bold text-white tracking-tight">
              {metrics.overallResilienceScore}%
            </h2>
            <p className="text-[9px] font-mono text-cyan-400/90 mt-1 flex items-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1" />
              ORCHESTRATOR ONLINE
            </p>
          </div>
          <div>{renderSparkline(resilienceHistory, '#06b6d4', 'resilience', 0, 100)}</div>
        </div>
      </div>

      {/* 2. Latency Monitor */}
      <div className="relative overflow-hidden bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-[115px] shadow-lg group hover:border-emerald-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 tracking-wider">PATH LATENCY</span>
          <Clock size={16} className="text-emerald-400" />
        </div>
        <div className="flex items-end justify-between mt-2 z-10">
          <div>
            <h2 className="text-3xl font-mono font-bold text-white tracking-tight">
              {metrics.averageLatency}ms
            </h2>
            <p className="text-[9px] font-mono text-slate-400 mt-1">
              Base SLA target: <span className="text-emerald-400 font-bold">&lt; 500ms</span>
            </p>
          </div>
          <div>{renderSparkline(latencyHistory, '#10b981', 'latency')}</div>
        </div>
      </div>

      {/* 3. Cost Metrics */}
      <div className="relative overflow-hidden bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-[115px] shadow-lg group hover:border-amber-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 tracking-wider">TOTAL INFERENCE COST</span>
          <DollarSign size={16} className="text-amber-400" />
        </div>
        <div className="flex items-end justify-between mt-2 z-10">
          <div>
            <h2 className="text-3xl font-mono font-bold text-white tracking-tight">
              ${metrics.totalCost.toFixed(4)}
            </h2>
            {metrics.savedCost > 0 ? (
              <p className="text-[9px] font-mono text-emerald-400 mt-1">
                Optimized Savings: +${metrics.savedCost.toFixed(4)}
              </p>
            ) : (
              <p className="text-[9px] font-mono text-slate-400 mt-1">
                Heuristics routing mode active
              </p>
            )}
          </div>
          <div>{renderSparkline(costHistory, '#f59e0b', 'cost')}</div>
        </div>
      </div>

      {/* 4. Infrastructure Health / Uptime */}
      <div className="relative overflow-hidden bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-[115px] shadow-lg group hover:border-rose-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 tracking-wider">SYSTEM UPTIME SLA</span>
          <Activity size={16} className="text-rose-400" />
        </div>
        <div className="flex items-end justify-between mt-2 z-10">
          <div>
            <h2 className="text-3xl font-mono font-bold text-white tracking-tight">
              {metrics.uptime.toFixed(3)}%
            </h2>
            <p className="text-[9px] font-mono text-slate-400 mt-1">
              Outages: <span className="text-rose-400 font-bold">{metrics.failedRequests} drops</span>
            </p>
          </div>
          <div>{renderSparkline(failedRequestsHistory, '#ef4444', 'uptime')}</div>
        </div>
      </div>
    </div>
  );
};
export default MetricsPanel;
