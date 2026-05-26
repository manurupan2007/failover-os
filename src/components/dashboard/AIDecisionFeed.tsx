import React, { useState, useRef, useEffect } from 'react';
import type { LogEntry } from '../../engine/types';
import { Cpu, Sparkles, Activity } from 'lucide-react';

interface AIDecisionFeedProps {
  logs: LogEntry[];
}

export const AIDecisionFeed: React.FC<AIDecisionFeedProps> = ({ logs }) => {
  const [filter, setFilter] = useState<'all' | 'routing' | 'mitigation' | 'threat'>('all');
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of the feed when new AI logs arrive
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'routing') return log.message.includes('[Inference Router]');
    if (filter === 'mitigation') return log.message.includes('[Resilience Engine]') || log.message.includes('[Mitigation Advisor]');
    if (filter === 'threat') return log.message.includes('[Anomaly Detector]') || log.message.includes('[Predictive SRE]');
    return true;
  });

  const getBadgeStyle = (msg: string) => {
    if (msg.includes('[Anomaly Detector]')) {
      return 'text-rose-400 bg-rose-950/40 border-rose-900/50';
    } else if (msg.includes('[Inference Router]')) {
      return 'text-cyan-400 bg-cyan-950/40 border-cyan-900/50';
    } else if (msg.includes('[Resilience Engine]')) {
      return 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50';
    } else if (msg.includes('[Mitigation Advisor]')) {
      return 'text-purple-400 bg-purple-950/40 border-purple-900/50';
    } else {
      return 'text-amber-400 bg-amber-950/40 border-amber-900/50';
    }
  };

  const getCleanMessage = (msg: string) => {
    return msg.replace(/^\[.*?\]\s*/, ''); // strip out the system prefix for rendering
  };

  const getSystemPrefix = (msg: string) => {
    const match = msg.match(/^\[(.*?)\]/);
    return match ? match[1] : 'COGNITIVE ENGINE';
  };

  return (
    <div className="bg-[#0b0c16]/90 border border-purple-950/50 rounded-xl p-4 flex flex-col h-[350px] shadow-lg shadow-purple-950/5 relative crt-scanline">
      {/* Decorative cyber grid scan sweep */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent h-[150%] w-full -translate-y-full animate-[scan_6s_linear_infinite] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-950/40 mb-3 z-10">
        <div className="flex items-center space-x-2">
          <Cpu size={14} className="text-purple-400 animate-pulse" />
          <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider flex items-center">
            AUTONOMOUS DECISION STREAM
            <span className="ml-2 w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          <Activity size={10} className="text-purple-500" />
          <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest">
            AI-SRE Cognitive Kernel
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1.5 mb-3 z-10">
        {(['all', 'routing', 'mitigation', 'threat'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-2 py-0.5 rounded text-[8px] font-mono border uppercase tracking-wider transition-all ${
              filter === t
                ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                : 'bg-transparent border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-350'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Scrolling Decisions Stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-purple-950 scrollbar-track-transparent z-10">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center flex-col text-slate-500 opacity-60">
            <Sparkles size={16} className="text-purple-500/40 animate-spin-slow mb-1.5" />
            <span className="text-[9px] font-mono uppercase tracking-widest">
              Calibrating Cognitive Buffer...
            </span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start space-x-2 p-2 rounded-lg text-[9.5px] font-mono border bg-purple-950/5 border-purple-900/10 text-slate-300 transition-all duration-300`}
            >
              {/* Timestamp */}
              <span className="text-purple-500/75 select-none">{log.realTimestamp}</span>

              {/* Source cognitive prefix */}
              <span className={`px-1.5 py-0.5 rounded-[3px] text-[7px] uppercase font-bold tracking-wider border ${getBadgeStyle(log.message)}`}>
                {getSystemPrefix(log.message)}
              </span>

              {/* Cognitive message details */}
              <span className="flex-1 leading-relaxed break-words text-slate-200">
                {getCleanMessage(log.message)}
              </span>
            </div>
          ))
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
};

export default AIDecisionFeed;
