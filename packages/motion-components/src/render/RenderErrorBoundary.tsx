import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class RenderErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("RenderErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f87171',
          padding: '2rem',
          fontFamily: 'monospace',
          textAlign: 'center',
          overflow: 'auto',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem',
            maxWidth: '100%'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#ef4444', fontSize: '1.25rem' }}>
              ⚠️ Render Error
            </h2>
            <div style={{ fontSize: '0.875rem', marginBottom: '1rem', wordBreak: 'break-all' }}>
              {this.state.error?.message}
            </div>
            
            {this.state.errorInfo && (
              <details style={{ textAlign: 'left', marginTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', color: '#94a3b8' }}>View Component Stack</summary>
                <pre style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.75rem', 
                  color: '#94a3b8', 
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
