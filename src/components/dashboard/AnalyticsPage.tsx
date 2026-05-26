import React, { useMemo } from 'react';
import type { SimulationSnapshot } from '../../engine/types';
import { BarChart3, TrendingUp, ShieldAlert, Award, Zap, DollarSign } from 'lucide-react';

interface AnalyticsPageProps {
  history: SimulationSnapshot[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ history }) => {
  const currentMetrics = useMemo(() => {
    if (history.length === 0) return null;
    return history[history.length - 1].metrics;
  }, [history]);

  // Calculations for historical comparisons
  const dataPoints = history.length;
  
  const mttrSeconds = useMemo(() => {
    // MTTR calculation simulation: autonomous mitigation makes recovery average 1-2 ticks (1-2s).
    // Manual recovery takes 5-10 ticks (5-10s).
    // Let's calculate a realistic, dynamic MTTR from the logs or metrics
    if (history.length === 0) return 0;
    
    let totalMitigationsApplied = 0;
    history.forEach((snap) => {
      totalMitigationsApplied += snap.activeMitigations.length;
    });

    if (totalMitigationsApplied === 0) return 0.0;
    // MTTR simulated based on recovery speed efficiency
    const efficiency = currentMetrics?.recoveryEfficiency || 100;
    return Number((1.5 + (100 - efficiency) * 0.15).toFixed(1));
  }, [history, currentMetrics]);

  // SLA violation count
  const slaBreaches = useMemo(() => {
    return history.filter((snap) => snap.metrics.averageLatency > 500 || snap.metrics.overallResilienceScore < 85).length;
  }, [history]);

  const renderLargeChart = () => {
    if (history.length < 2) {
      return (
        <div className="h-[220px] flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            Awaiting telemetry cycles to generate latency profiles
          </span>
        </div>
      );
    }

    const width = 800;
    const height = 220;
    const padding = 20;

    const latencies = history.map((h) => h.metrics.averageLatency);
    const maxLat = Math.max(...latencies, 600); // scale at least to 600ms
    const minLat = Math.min(...latencies, 0);

    const latPoints = history
      .map((snap, idx) => {
        const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
        const y = height - padding - ((snap.metrics.averageLatency - minLat) / (maxLat - minLat)) * (height - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const resPoints = history
      .map((snap, idx) => {
        const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
        const y = height - padding - (snap.metrics.overallResilienceScore / 100) * (height - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <div className="relative bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 shadow-lg w-full">
        <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
          <TrendingUp size={12} className="text-cyan-400 mr-1" />
          REALTIME COMPARATIVE PERFORMANCE PROFILE (RESILIENCE VS LATENCY)
        </h4>

        <div className="relative w-full h-[220px]">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* SLA limit line */}
            <line
              x1={padding}
              y1={height - padding - (500 / maxLat) * (height - padding * 2)}
              x2={width - padding}
              y2={height - padding - (500 / maxLat) * (height - padding * 2)}
              stroke="#ef4444"
              strokeDasharray="4,4"
              strokeWidth="1.2"
            />
            <text
              x={width - padding - 80}
              y={height - padding - (500 / maxLat) * (height - padding * 2) - 5}
              fill="#ef4444"
              className="text-[8px] font-mono"
            >
              SLA BREACH CEILING (500ms)
            </text>

            {/* Grid Lines */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="0.5" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#334155" strokeWidth="0.5" />

            {/* Latency curve (emerald) */}
            <polyline points={latPoints} fill="none" stroke="#10b981" strokeWidth="2" />
            
            {/* Resilience Index curve (cyan) */}
            <polyline points={resPoints} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3,1" />

            {/* Labels */}
            <text x={padding} y={height - 5} fill="#475569" className="text-[8px] font-mono">T-Minus {dataPoints}s</text>
            <text x={width - padding - 25} y={height - 5} fill="#475569" className="text-[8px] font-mono">Current</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-[#10b981] inline-block" />
            <span className="text-[9px] font-mono text-slate-400">Average Latency (ms)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-[#06b6d4] stroke-dasharray-[3,1] inline-block" />
            <span className="text-[9px] font-mono text-slate-400">Resilience Score (%)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* Overview HUD Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* MTTR */}
        <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-[100px] shadow-lg group hover:border-cyan-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">MEAN TIME TO RECOVER (MTTR)</span>
            <Zap size={14} className="text-cyan-400 animate-pulse" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
              {mttrSeconds > 0 ? `${mttrSeconds}s` : '0.0s'}
            </h3>
            <p className="text-[9px] font-mono text-slate-500 mt-1">
              Autonomous vs <span className="text-rose-400">18.4m manual fallback</span>
            </p>
          </div>
        </div>

        {/* SLA breaches */}
        <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-[100px] shadow-lg group hover:border-rose-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">SLA DEGRADATION EVENTS</span>
            <ShieldAlert size={14} className="text-rose-500" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
              {slaBreaches}
            </h3>
            <p className="text-[9px] font-mono text-slate-500 mt-1">
              Breach events detected in trace pipeline
            </p>
          </div>
        </div>

        {/* Accumulated Cost Savings */}
        <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-[100px] shadow-lg group hover:border-emerald-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">ACCUMULATED SAVINGS</span>
            <DollarSign size={14} className="text-emerald-400" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
              ${currentMetrics?.savedCost ? currentMetrics.savedCost.toFixed(4) : '0.0000'}
            </h3>
            <p className="text-[9px] font-mono text-emerald-400/90 mt-1">
              Via compression + routing policies
            </p>
          </div>
        </div>

        {/* Resilience Badge */}
        <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-[100px] shadow-lg group hover:border-purple-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">RECOVERY EFFICIENCY</span>
            <Award size={14} className="text-purple-400" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
              {currentMetrics?.recoveryEfficiency ? `${currentMetrics.recoveryEfficiency}%` : '100%'}
            </h3>
            <p className="text-[9px] font-mono text-slate-500 mt-1">
              Resource utilization efficiency metric
            </p>
          </div>
        </div>
      </div>

      {/* Large graph */}
      {renderLargeChart()}

      {/* SLA Policy Compliance Table */}
      <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 shadow-lg w-full">
        <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
          <BarChart3 size={12} className="text-cyan-400 mr-1" />
          SLO & INFRASTRUCTURE INTEGRITY SCORECARD
        </h4>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-[10px] font-mono">
            <thead>
              <tr className="border-b border-slate-800/60 text-slate-400">
                <th className="pb-2 font-semibold">POLICY DOMAIN</th>
                <th className="pb-2 font-semibold">OBJECTIVE (SLO)</th>
                <th className="pb-2 font-semibold">ACTUAL</th>
                <th className="pb-2 font-semibold text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/30 text-slate-200">
              <tr className="border-b border-slate-800/30">
                <td className="py-2.5">Global Service Availability</td>
                <td className="py-2.5">99.90%</td>
                <td className="py-2.5 font-bold text-white">
                  {currentMetrics?.uptime ? `${currentMetrics.uptime.toFixed(3)}%` : '100.000%'}
                </td>
                <td className={`py-2.5 text-right font-bold ${(currentMetrics?.uptime ?? 100) >= 99.9 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                  {(currentMetrics?.uptime ?? 100) >= 99.9 ? 'COMPLIANT' : 'DEGRADED'}
                </td>
              </tr>
              <tr className="border-b border-slate-800/30">
                <td className="py-2.5">Inference SLA Target Latency</td>
                <td className="py-2.5">&lt; 500ms</td>
                <td className="py-2.5 font-bold text-white">
                  {currentMetrics?.averageLatency ? `${currentMetrics.averageLatency}ms` : '410ms'}
                </td>
                <td className={`py-2.5 text-right font-bold ${(currentMetrics?.averageLatency ?? 410) <= 500 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                  {(currentMetrics?.averageLatency ?? 410) <= 500 ? 'COMPLIANT' : 'BREACH'}
                </td>
              </tr>
              <tr className="border-b border-slate-800/30">
                <td className="py-2.5">Cascade Isolation MTTR</td>
                <td className="py-2.5">&lt; 3.0s</td>
                <td className="py-2.5 font-bold text-white">
                  {mttrSeconds > 0 ? `${mttrSeconds}s` : '0.0s'}
                </td>
                <td className={`py-2.5 text-right font-bold ${mttrSeconds <= 3.0 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                  {mttrSeconds <= 3.0 ? 'COMPLIANT' : 'EXCEEDED'}
                </td>
              </tr>
              <tr>
                <td className="py-2">System Resilience Index</td>
                <td className="py-2">&gt; 90%</td>
                <td className="py-2 font-bold text-white">
                  {currentMetrics?.overallResilienceScore ? `${currentMetrics.overallResilienceScore}%` : '98%'}
                </td>
                <td className={`py-2 text-right font-bold ${
                  (currentMetrics?.overallResilienceScore ?? 98) >= 90 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                }`}>
                  {(currentMetrics?.overallResilienceScore ?? 98) >= 90 ? 'COMPLIANT' : 'WARNING DEGRADED'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsPage;
