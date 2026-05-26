import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-[#090d16] border border-slate-800 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-950/30 border border-rose-900/50 flex items-center justify-center">
              <span className="text-rose-400 text-xl">!</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-400 mb-1">
              The simulation encountered an unexpected error.
            </p>
            <pre className="text-xs text-rose-400/80 bg-slate-950 border border-slate-900 rounded-lg p-3 mt-4 mb-6 text-left overflow-auto max-h-32 font-mono">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={this.handleReset}
              className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-slate-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
