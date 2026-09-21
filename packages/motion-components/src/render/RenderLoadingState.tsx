import React from 'react';

export type LoadingStatus = 'idle' | 'loading' | 'rendering' | 'ready' | 'error';

interface RenderLoadingStateProps {
  status: LoadingStatus;
  message?: string;
  children: React.ReactNode;
}

export const RenderLoadingState: React.FC<RenderLoadingStateProps> = ({ status, message, children }) => {
  if (status === 'ready' || status === 'idle') {
    return <>{children}</>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Show the child beneath slightly dimmed while loading/rendering */}
      <div style={{ opacity: 0.3, width: '100%', height: '100%' }}>
        {children}
      </div>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
        zIndex: 9999
      }}>
        {status === 'loading' || status === 'rendering' ? (
          <>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>
              {status === 'rendering' ? 'Rendering Frame...' : 'Loading Assets...'}
            </div>
          </>
        ) : status === 'error' ? (
          <div style={{ color: '#ef4444', fontWeight: 'bold' }}>
            Failed to Load
          </div>
        ) : null}
        
        {message && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
