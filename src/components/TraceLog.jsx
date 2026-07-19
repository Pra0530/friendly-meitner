import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TraceLog = ({ trace, step, setStep, MAX_STEP }) => {
  const containerRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (collapsed) return;
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [step, collapsed]);

  const currentExplanation = trace[step]?.explanation || '';

  return (
    <div style={{ flexShrink: 0, marginTop: '8px' }}>
      {/* Collapsible header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-glass)',
          borderRadius: collapsed ? '8px' : '8px 8px 0 0',
          padding: '7px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.8px'
        }}
      >
        <span>AI TRACE LOG</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!collapsed && currentExplanation && (
            <span style={{
              color: 'var(--accent-color)',
              fontSize: '11px',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: '400'
            }}>
              {currentExplanation}
            </span>
          )}
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="log-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              ref={containerRef}
              style={{
                overflowY: 'auto',
                maxHeight: '100px',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid var(--border-glass)',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <button
                onClick={() => setStep(0)}
                data-active={step === 0}
                style={{
                  textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 6px', color: step === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderLeft: step === 0 ? '2px solid var(--accent-color)' : '2px solid transparent',
                  fontSize: '12px'
                }}
              >
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', marginRight: '8px' }}>[Start]</span>
                Ready to execute.
              </button>

              {trace?.slice(1).map((t, idx) => {
                const i = idx + 1;
                const active = i === step;
                return (
                  <button
                    key={idx}
                    onClick={() => setStep(i)}
                    data-active={active}
                    style={{
                      textAlign: 'left', background: active ? 'rgba(56,189,248,0.08)' : 'none',
                      border: 'none', cursor: 'pointer',
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      borderLeft: active ? '2px solid var(--accent-color)' : '2px solid transparent',
                      padding: '3px 8px', borderRadius: '3px', fontSize: '12px',
                      marginLeft: '-8px', transition: 'background 0.15s'
                    }}
                  >
                    <span style={{ color: active ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold', marginRight: '8px' }}>
                      [Step {i}]
                    </span>
                    {t.explanation || `Line ${t.line}`}
                  </button>
                );
              })}

              {step >= MAX_STEP && MAX_STEP > 0 && (
                <div style={{ color: 'var(--success-color)', fontSize: '12px', marginTop: '4px' }}>
                  ✓ Execution Complete
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TraceLog;
