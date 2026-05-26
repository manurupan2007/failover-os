import React from 'react';
import type { SimulationSnapshot } from '../engine/types';
import { Play, Pause, ChevronLeft, ChevronRight, History } from 'lucide-react';

interface ReplayCenterProps {
  snapshots: SimulationSnapshot[];
  isReplaying: boolean;
  replayIndex: number;
  onToggleReplayMode: (active: boolean) => void;
  onSetReplayIndex: (index: number) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
}

export const ReplayCenter: React.FC<ReplayCenterProps> = ({
  snapshots,
  isReplaying,
  replayIndex,
  onToggleReplayMode,
  onSetReplayIndex,
  onStepForward,
  onStepBackward,
}) => {
  const totalFrames = snapshots.length;
  const currentFrame = replayIndex === -1 ? totalFrames - 1 : replayIndex;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10);
    if (!isReplaying) {
      onToggleReplayMode(true);
    }
    onSetReplayIndex(idx);
  };

  const formatSimTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    return `T+${sec}s`;
  };

  // Find frames containing chaos incidents to place markers on the slider
  const incidentMarkers = React.useMemo(() => {
    return snapshots.map((snap, idx) => {
      return {
        idx,
        hasIncident: snap.activeChaosIncidents.length > 0,
        incidentCount: snap.activeChaosIncidents.length,
      };
    }).filter((m) => m.hasIncident && m.idx % 3 === 0); // sample for markers
  }, [snapshots]);

  return (
    <div className="bg-[#090d16]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col shadow-lg w-full">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3.5">
        <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider flex items-center">
          <History size={14} className="text-cyan-400 mr-1.5" />
          HISTORICAL REPLAY & INCIDENT TIMELINE
        </h3>
        <div className="flex items-center space-x-2">
          {isReplaying ? (
            <span className="px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/50 text-cyan-400 text-[8px] font-mono animate-pulse uppercase tracking-wider">
              PLAYBACK ACTIVE: FRAME {currentFrame + 1}/{totalFrames}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 text-[8px] font-mono uppercase tracking-wider">
              REALTIME RECORDING ({totalFrames} FRAMES)
            </span>
          )}
          
          {isReplaying && (
            <button
              onClick={() => onToggleReplayMode(false)}
              className="px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 text-[8px] font-mono uppercase tracking-wider transition-colors"
            >
              Exit Playback
            </button>
          )}
        </div>
      </div>

      {/* Main Scrubber Control bar */}
      <div className="flex items-center space-x-3 w-full mt-1.5">
        {/* Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onStepBackward}
            disabled={totalFrames <= 1 || currentFrame === 0}
            className="p-1 rounded bg-slate-800/60 hover:bg-slate-700 border border-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-all"
            title="Step Backward"
          >
            <ChevronLeft size={13} />
          </button>

          <button
            onClick={() => onToggleReplayMode(!isReplaying)}
            disabled={totalFrames === 0}
            className={`p-1.5 rounded border transition-all ${
              isReplaying
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400 hover:bg-cyan-950/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title={isReplaying ? 'Pause Playback' : 'Start Playback'}
          >
            {isReplaying ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <button
            onClick={onStepForward}
            disabled={totalFrames <= 1 || currentFrame === totalFrames - 1}
            className="p-1 rounded bg-slate-800/60 hover:bg-slate-700 border border-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-all"
            title="Step Forward"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Range Scrubber with background incident markers */}
        <div className="flex-1 relative flex items-center h-6 select-none">
          {/* Slider input */}
          <input
            type="range"
            min={0}
            max={totalFrames > 0 ? totalFrames - 1 : 0}
            value={currentFrame}
            onChange={handleSliderChange}
            disabled={totalFrames <= 1}
            aria-label="Simulation timeline scrubber"
            aria-valuemin={0}
            aria-valuemax={totalFrames > 0 ? totalFrames - 1 : 0}
            aria-valuenow={currentFrame}
            aria-valuetext={totalFrames > 0 && snapshots[currentFrame] ? formatSimTime(snapshots[currentFrame].timestamp) : 'T+0s'}
            className="w-full h-1.5 rounded-lg appearance-none bg-slate-800 accent-cyan-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none"
          />

          {/* Render markers */}
          {totalFrames > 0 &&
            incidentMarkers.map((marker) => {
              const leftPercent = (marker.idx / (totalFrames - 1)) * 100;
              return (
                <div
                  key={marker.idx}
                  className="absolute w-1.5 h-1.5 rounded-full bg-rose-500 border border-black pointer-events-none transform -translate-x-1/2"
                  style={{ left: `${leftPercent}%`, top: '48%' }}
                  title={`${marker.incidentCount} active failures at Frame ${marker.idx}`}
                />
              );
            })}
        </div>

        {/* Timestamp */}
        <div className="w-[50px] text-right">
          <span className="text-[10px] font-mono font-bold text-slate-300">
            {totalFrames > 0 && snapshots[currentFrame]
              ? formatSimTime(snapshots[currentFrame].timestamp)
              : 'T+0s'}
          </span>
        </div>
      </div>

      {/* Info / Timeline log trace of selected frame */}
      {totalFrames > 0 && snapshots[currentFrame] && (
        <div className="mt-3.5 bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
              Snapshot telemetry
            </div>
            <div className="flex space-x-4">
              <span className="text-[10px] font-mono text-slate-300">
                Resilience Score:{' '}
                <span className="text-cyan-400 font-bold">
                  {snapshots[currentFrame].metrics.overallResilienceScore}%
                </span>
              </span>
              <span className="text-[10px] font-mono text-slate-300">
                Latency:{' '}
                <span className="text-emerald-400 font-bold">
                  {snapshots[currentFrame].metrics.averageLatency}ms
                </span>
              </span>
              <span className="text-[10px] font-mono text-slate-300">
                Active Outages:{' '}
                <span className="text-rose-400 font-bold">
                  {snapshots[currentFrame].activeChaosIncidents.length}
                </span>
              </span>
              <span className="text-[10px] font-mono text-slate-300">
                Active Mitigations:{' '}
                <span className="text-emerald-400 font-bold">
                  {snapshots[currentFrame].activeMitigations.length}
                </span>
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
              Timestamp
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {snapshots[currentFrame].logs[0]?.realTimestamp || '00:00:00'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReplayCenter;
