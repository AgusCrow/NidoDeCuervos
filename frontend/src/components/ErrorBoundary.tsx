import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Shield, RefreshCw, AlertTriangle, LogOut } from 'lucide-react';
import { clearStoredToken } from '../services/api';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL REACT UNHANDLED ERROR CAPTURED BY ERROR BOUNDARY:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleLogout = () => {
    clearStoredToken();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-surface via-background to-black text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-crimson/20 border-2 border-crimson flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse">
            <AlertTriangle className="w-10 h-10 text-crimson" />
          </div>

          <div className="max-w-md space-y-3">
            <h1 className="font-cinzel text-2xl font-black text-crimson tracking-wider uppercase">
              ¡PERGAMINO CONFRONTADO CON MAGIA NEGRA!
            </h1>
            <p className="text-xs text-gray-300 font-cinzel leading-relaxed">
              Ocurrió un error inesperado al renderizar el Grimorio. No te preocupes, los datos de tu aventurero están seguros en la base de datos de la taberna.
            </p>
          </div>

          {this.state.error && (
            <div className="max-w-lg w-full bg-black/80 border border-crimson/40 rounded-xl p-4 text-left font-mono text-[11px] text-rose-300 space-y-2 overflow-x-auto">
              <div className="font-bold text-crimson flex items-center gap-1.5">
                <Shield className="w-4 h-4 shrink-0" />
                <span>Mensaje de Error:</span>
              </div>
              <p className="break-words">{this.state.error.toString()}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-black font-cinzel font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_var(--accent-glow)] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recargar Aplicación</span>
            </button>

            <button
              onClick={this.handleLogout}
              className="w-full py-3 rounded-xl bg-surface-card hover:bg-crimson/20 border border-surface-border text-gray-300 hover:text-crimson font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
