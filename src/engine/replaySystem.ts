import type { SimulationSnapshot } from './types';

export class ReplaySystem {
  private snapshots: SimulationSnapshot[] = [];
  private isReplaying = false;
  private currentReplayIndex = -1;

  public recordSnapshot(snapshot: SimulationSnapshot): void {
    if (this.isReplaying) return; // Do not record during playback

    this.snapshots.push(snapshot);
    // Cap historical snapshots to 1000 (roughly 15-20 minutes of simulation)
    if (this.snapshots.length > 1000) {
      this.snapshots.shift();
    }
  }

  public getSnapshots(): SimulationSnapshot[] {
    return this.snapshots;
  }

  public clear(): void {
    this.snapshots = [];
    this.isReplaying = false;
    this.currentReplayIndex = -1;
  }

  public setReplaying(replaying: boolean): void {
    this.isReplaying = replaying;
  }

  public getIsReplaying(): boolean {
    return this.isReplaying;
  }

  public getReplayIndex(): number {
    return this.currentReplayIndex;
  }

  public setReplayIndex(index: number): void {
    if (index >= 0 && index < this.snapshots.length) {
      this.currentReplayIndex = index;
    }
  }

  public getSnapshotAtIndex(index: number): SimulationSnapshot | null {
    if (index >= 0 && index < this.snapshots.length) {
      return this.snapshots[index];
    }
    return null;
  }

  public stepForward(): SimulationSnapshot | null {
    if (this.currentReplayIndex < this.snapshots.length - 1) {
      this.currentReplayIndex++;
      return this.snapshots[this.currentReplayIndex];
    }
    return null;
  }

  public stepBackward(): SimulationSnapshot | null {
    if (this.currentReplayIndex > 0) {
      this.currentReplayIndex--;
      return this.snapshots[this.currentReplayIndex];
    }
    return null;
  }
}
export default ReplaySystem;
