import React, { useState } from 'react';
import type { LogEntry } from '../engine/types';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Terminal, Trash2 } from 'lucide-react';

interface AlertStreamProps {
  logs: LogEntry[];
  onClearLogs?: () => void;
}

export const AlertStream: React.FC<AlertStreamProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'success' | 'info'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const getLogIcon = (type: LogEntry['type']) => {
    const size = 13;
    switch (type) {
      case 'error':
        return <AlertCircle size={size} className="text-rose-500 min-w-[13px]" />;
      case 'warning':
        return <AlertTriangle size={size} className="text-amber-500 min-w-[13px]" />;
      case 'success':
        return <CheckCircle size={size} className="text-emerald-500 min-w-[13px]" />;
      case 'info':
      default:
        return <Info size={size} className="text-blue-400 min-w-[13px]" />;
    }
  };

  const getSourceStyle = (source: LogEntry['source']) => {
    switch (source) {
      case 'chaos_injector':
        return 'text-rose-400 bg-rose-950/30 border border-rose-900/30';
      case 'ai_predictor':
        return 'text-purple-400 bg-purple-950/30 border border-purple-900/30';
      case 'recovery_engine':
        return 'text-cyan-400 bg-cyan-950/30 border border-cyan-900/30';
      case 'simulation':
      default:
        return 'text-slate-400 bg-slate-800/40 border border-slate-700/30';
    }
  };

  const formatSource = (source: LogEntry['source']) => {
    return source.replaceAll('_', ' ').toUpperCase();
  };

  return (
    <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col h-[350px] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
        <div className="flex items-center space-x-2">
          <Terminal size={14} className="text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider">
            KERNEL OBSERVABILITY LOGS
          </h3>
        </div>
        {onClearLogs && (
          <button
            onClick={onClearLogs}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-800/40"
            title="Clear Stream"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1.5 mb-3">
        {(['all', 'error', 'warning', 'success', 'info'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-2 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider transition-all ${
              filter === t
                ? 'bg-cyan-950/50 border-cyan-500 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                : 'bg-transparent border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Logs Scroll container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center flex-col">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              No alerts in trace buffer
            </span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start space-x-2 p-2 rounded-lg text-[10px] font-mono border ${
                log.type === 'error'
                  ? 'bg-rose-950/5 border-rose-950/20 text-rose-300/90'
                  : log.type === 'warning'
                  ? 'bg-amber-950/5 border-amber-950/20 text-amber-300/90'
                  : log.type === 'success'
                  ? 'bg-emerald-950/5 border-emerald-950/20 text-emerald-300/90'
                  : 'bg-slate-900/10 border-slate-800/30 text-slate-300'
              }`}
            >
              {/* Status icon */}
              <div className="mt-0.5">{getLogIcon(log.type)}</div>

              {/* Timestamp */}
              <span className="text-slate-500 select-none">{log.realTimestamp}</span>

              {/* Source tag */}
              <span className={`px-1.5 py-0.5 rounded-[3px] text-[7.5px] uppercase font-bold tracking-wider ${getSourceStyle(log.source)}`}>
                {formatSource(log.source)}
              </span>

              {/* Message text */}
              <span className="flex-1 leading-relaxed break-words">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default AlertStream;
