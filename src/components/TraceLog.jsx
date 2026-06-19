import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const TraceLog = ({ trace, step, setStep, MAX_STEP }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to active step
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [step]);

  return (
    <div 
      className="output-console" 
      ref={containerRef}
      style={{ 
        position: 'relative', 
        overflowY: 'auto', 
        maxHeight: '150px', 
        marginTop: 'auto', 
        padding: '16px', 
        background: 'rgba(0, 0, 0, 0.3)', 
        border: '1px solid var(--border-glass)', 
        borderRadius: '8px', 
        fontSize: '14px' 
      }}
    >
      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '1px', position: 'sticky', top: 0, background: 'var(--bg-surface)', paddingBottom: '8px', zIndex: 10 }}>
        AI TRACE LOG
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'var(--font-mono)' }}>
        <button 
          onClick={() => setStep(0)}
          data-active={step === 0}
          style={{ 
            textAlign: 'left',
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            padding: '4px',
            color: step === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
            opacity: step === 0 ? 1 : 0.7,
            borderLeft: step === 0 ? '2px solid var(--accent-color)' : '2px solid transparent'
          }}
        >
          <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', marginRight: '8px' }}>[Start]</span>
          Ready to execute. Click Play or Next.
        </button>
        
        {trace?.slice(1).map((t, idx) => {
          const actualStepIndex = idx + 1;
          const isCurrent = (actualStepIndex === step);
          return (
            <motion.button 
              key={idx}
              onClick={() => setStep(actualStepIndex)}
              data-active={isCurrent}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ 
                textAlign: 'left',
                background: isCurrent ? 'rgba(56, 189, 248, 0.1)' : 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                opacity: isCurrent ? 1 : 0.7,
                borderLeft: isCurrent ? '2px solid var(--accent-color)' : '2px solid transparent',
                padding: '6px 10px',
                marginLeft: '-12px',
                borderRadius: '4px',
                transition: 'background 0.2s ease'
              }}
            >
              <span style={{ color: isCurrent ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: 'bold', marginRight: '8px' }}>
                [Step {actualStepIndex}]
              </span>
              {t.explanation}
            </motion.button>
          );
        })}
        
        {step >= MAX_STEP && MAX_STEP > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--success-color)', marginTop: '8px' }}>
            &gt; Execution Complete
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TraceLog;
