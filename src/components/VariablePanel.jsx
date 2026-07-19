import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Names that come from the Python tracer / pyodide runtime — never show these
const INTERNAL_VAR_NAMES = new Set([
  'trace_steps','tracer','sys','json','object_ids','all_nodes',
  'get_object_id','serialize_val','user_code_lines','user_code',
  'blocked_modules','_pyodide_core','builtins','INTERNAL_NAMES',
  'flat_nodes','result','mod','__name__','__doc__','__builtins__'
]);

const VariablePanel = ({ traceHistory, currentVariables }) => {
  const filteredVars = Object.fromEntries(
    Object.entries(currentVariables || {}).filter(([k]) => !INTERNAL_VAR_NAMES.has(k) && !k.startsWith('__'))
  );
  if (!filteredVars || Object.keys(filteredVars).length === 0) return null;

  // Compute history for each variable
  const variableHistory = {};
  
  traceHistory.forEach(t => {
    if (t.variables) {
      Object.entries(t.variables).forEach(([k, v]) => {
        if (!variableHistory[k]) variableHistory[k] = [];
        const lastVal = variableHistory[k][variableHistory[k].length - 1];
        if (lastVal !== String(v)) {
          variableHistory[k].push(String(v));
        }
      });
    }
  });

  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
      {Object.entries(filteredVars).map(([k, v]) => {
        const history = variableHistory[k] || [String(v)];
        const isNullOrUndefined = v === 'null' || v === 'undefined' || v === null;
        
        return (
          <div 
            key={k} 
            className="group"
            style={{ 
              background: 'var(--bg-surface)', 
              padding: '10px 16px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-glass)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{k}</span>
              <strong style={{ 
                color: isNullOrUndefined ? 'var(--text-muted)' : 'var(--accent-color)', 
                fontFamily: 'var(--font-mono)',
                fontSize: '15px'
              }}>
                {String(v)}
              </strong>
            </div>
            
            {history.length > 1 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                opacity: 0.8,
                marginTop: '4px'
              }}>
                {history.slice(-4).map((h, i, arr) => (
                  <React.Fragment key={i}>
                    <span style={{ 
                      color: i === arr.length - 1 ? 'var(--accent-color)' : 'inherit',
                      fontWeight: i === arr.length - 1 ? 'bold' : 'normal'
                    }}>
                      {h}
                    </span>
                    {i < arr.length - 1 && <span style={{ opacity: 0.5 }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
            )}
            
            {/* Full history tooltip on hover */}
            <div 
              className="tooltip"
              style={{
                position: 'absolute',
                top: '-100%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#000',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--border-glass)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                opacity: 0,
                pointerEvents: 'none',
                transition: 'opacity 0.2s ease',
                zIndex: 20
              }}
            >
              History: {history.join(' → ')}
            </div>
            <style>{`
              .group:hover .tooltip { opacity: 1 !important; }
            `}</style>
          </div>
        );
      })}
    </div>
  );
};

export default VariablePanel;
