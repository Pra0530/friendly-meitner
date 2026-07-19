import React from 'react';
import { Wifi, AlertCircle, RefreshCw, Layers } from 'lucide-react';

const StatusBar = ({ isAnalyzing, diagnosticsCount = 0, isPython = false }) => {
  return (
    <div style={{
      background: '#0d0d0f',
      borderTop: '1px solid var(--border-glass)',
      padding: '4px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: 'var(--text-secondary)',
      fontSize: '11px',
      fontFamily: 'var(--font-mono)',
      userSelect: 'none',
      height: '24px',
      zIndex: 100
    }}>
      {/* Left panel - State visibility */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* LSP Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Wifi size={12} color="var(--success-color)" />
          <span>LSP: Connected (Worker)</span>
        </div>

        {/* Diagnostics Counts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <AlertCircle size={12} color={diagnosticsCount > 0 ? 'var(--danger-color)' : 'var(--text-muted)'} />
          <span>{diagnosticsCount} Errors</span>
        </div>

        {/* Dynamic Running indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {isAnalyzing ? (
            <>
              <RefreshCw size={11} className="spin" color="var(--warning-color)" />
              <span style={{ color: 'var(--warning-color)' }}>Running Tracer...</span>
            </>
          ) : (
            <>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-color)' }} />
              <span>IDE: Idle</span>
            </>
          )}
        </div>
      </div>

      {/* Right panel - Environment stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Active Plugins */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Layers size={12} color="var(--accent-color)" />
          <span>2 Sandbox Plugins</span>
        </div>

        {/* Language */}
        <span>{isPython ? 'Python' : 'JavaScript (ES6)'}</span>
        
        {/* State */}
        <span style={{ color: 'var(--success-color)' }}>Sync: LocalStorage</span>
      </div>
    </div>
  );
};

export default StatusBar;
