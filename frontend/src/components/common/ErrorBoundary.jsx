import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GymPulse UI caught an unhandled render error:', error, errorInfo);
    const msg = error?.message || String(error);
    const isChunkError = /Failed to fetch dynamically imported module|dynamically imported|Loading chunk/i.test(msg);
    if (isChunkError) {
      const lastReload = parseInt(window.sessionStorage.getItem('gympulse_last_chunk_reload') || '0', 10);
      const now = Date.now();
      // If we haven't auto-reloaded in the past 15 seconds, reload once automatically to fetch newest modules
      if (now - lastReload > 15000) {
        window.sessionStorage.setItem('gympulse_last_chunk_reload', String(now));
        const separator = window.location.search ? '&' : '?';
        window.location.href = window.location.pathname + (window.location.search || '') + separator + '_v=' + now + (window.location.hash || '');
      }
    }
  }

  handleReload = () => {
    try {
      window.sessionStorage.removeItem('gympulse_chunk_retry');
      window.sessionStorage.removeItem('gympulse_last_chunk_reload');
      const now = Date.now();
      const separator = window.location.search ? '&' : '?';
      window.location.href = window.location.pathname + (window.location.search || '') + separator + '_v=' + now + (window.location.hash || '');
    } catch (e) {
      window.location.reload();
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || String(this.state.error);
      const isChunkError = /Failed to fetch dynamically imported module|dynamically imported|Loading chunk/i.test(msg);

      return (
        <div className="min-h-[420px] flex items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              {isChunkError ? 'New App Version Available' : 'Something went wrong loading this screen'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {isChunkError
                ? 'An updated version of GymPulse was deployed. Reload to load the latest module.'
                : 'An unexpected error occurred while displaying this module. You can reload the module or return to the main dashboard safely.'}
            </p>
            {this.state.error && (
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-rose-500 text-left mb-6 break-words max-h-28 overflow-y-auto">
                {msg}
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/20 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
