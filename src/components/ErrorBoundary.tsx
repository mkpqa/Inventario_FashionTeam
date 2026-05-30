import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      errorInfo: null, 
      showDetails: false 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  private handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText);
    alert('Detalles del error copiados al portapapeles. ¡Puedes enviárselo a soporte!');
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-[#fafafa] px-6 py-12 selection:bg-brand-primary/30">
          <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Icono de Alerta Animado */}
            <div className="flex justify-center">
              <div className="p-4 bg-status-error/15 text-status-error rounded-full border border-status-error/25 animate-pulse">
                <AlertTriangle size={36} />
              </div>
            </div>

            {/* Encabezado */}
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-[#fafafa]">¡Algo no salió como esperábamos!</h1>
              <p className="text-sm text-[#71717a]">
                La aplicación experimentó un conflicto interno (probablemente por una extensión del navegador o traducción).
              </p>
            </div>

            {/* Acciones */}
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full h-11 bg-brand-primary text-[#09090b] font-bold rounded-xl shadow-lg hover:bg-brand-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={16} />
                Recargar aplicación
              </button>
            </div>

            {/* Detalles del error */}
            <div className="border-t border-[#27272a] pt-4">
              <button
                onClick={this.toggleDetails}
                className="flex items-center justify-center gap-1.5 w-full py-1 text-xs font-semibold text-[#a1a1aa] hover:text-[#fafafa] transition-colors cursor-pointer"
              >
                {this.state.showDetails ? (
                  <>
                    Ocultar detalles técnicos
                    <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    Mostrar detalles técnicos
                    <ChevronDown size={14} />
                  </>
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-4 text-left space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-[#09090b] border border-[#27272a] p-4 rounded-xl max-h-48 overflow-y-auto font-mono text-[10px] text-status-error leading-relaxed">
                    <p className="font-bold mb-1">Message: {this.state.error?.toString()}</p>
                    <p className="whitespace-pre-wrap opacity-75">{this.state.errorInfo?.componentStack}</p>
                  </div>
                  <button
                    onClick={this.handleCopyError}
                    className="w-full py-2 bg-[#27272a] hover:bg-[#3f3f46] text-xs font-bold text-[#fafafa] rounded-lg transition-colors cursor-pointer"
                  >
                    Copiar detalles del error
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
