import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, GitBranch, RotateCcw, CheckCircle2, XCircle, Cpu } from 'lucide-react';

/**
 * VariablesLayout — Beautiful step-by-step visualization for simple/conditional/loop code.
 * Shows: Variable memory cells, current line highlight, condition evaluation, branch flow.
 */
const VariablesLayout = ({ currentState, trace, step }) => {
  const variables = currentState?.variables || {};
  const action = currentState?.action || 'assignment';
  const lineText = currentState?.line_text || '';
  const lineNum = currentState?.line || 0;

  // Build ordered variable entries, filtering noise
  const varEntries = Object.entries(variables).filter(([k]) =>
    !k.startsWith('__') && k !== 'tracer' && k !== 'sys' && k !== 'json'
  );

  // Collect all variable names seen across all steps for stable ordering
  const allVarNames = [];
  const seen = new Set();
  (trace || []).forEach(s => {
    Object.keys(s.variables || {}).forEach(k => {
      if (!seen.has(k)) { seen.add(k); allVarNames.push(k); }
    });
  });

  // Detect if a condition was just evaluated — find nearest condition step at/before current
  let conditionResult = null;
  let conditionExpr = '';
  for (let i = step; i >= 0; i--) {
    const s = trace[i];
    if (!s) continue;
    if (s.action === 'condition') {
      conditionExpr = s.line_text || '';
      // The next step shows the branch taken — if it's deeper, condition was TRUE
      const nextStep = trace[i + 1];
      if (nextStep) {
        conditionResult = nextStep.depth >= s.depth ? true : false;
      }
      break;
    }
    if (s.action === 'assignment' || s.action === 'loop') break;
  }

  // Collect output (print calls) — look for output in prior steps' line_text
  const outputs = [];
  for (let i = 0; i <= step; i++) {
    const s = trace[i];
    if (s && s.action === 'call' && (s.line_text || '').includes('print(')) {
      const match = (s.line_text || '').match(/print\((.*)\)/);
      if (match) outputs.push(match[1]);
    }
  }

  // Color per action
  const actionColors = {
    assignment: { bg: 'rgba(59, 130, 246, 0.12)', border: '#3b82f6', label: 'ASSIGN', icon: '=' },
    condition: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', label: 'CHECK', icon: '?' },
    loop: { bg: 'rgba(139, 92, 246, 0.12)', border: '#8b5cf6', label: 'LOOP', icon: '↺' },
    call: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', label: 'CALL', icon: '→' },
    return: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', label: 'RETURN', icon: '⬅' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', label: 'ERROR', icon: '✕' },
  };
  const actionStyle = actionColors[action] || actionColors.assignment;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '8px 4px',
      overflowY: 'auto'
    }}>

      {/* ── Step Badge ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: actionStyle.bg,
          border: `1px solid ${actionStyle.border}`,
          borderRadius: '8px',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}>
          <span style={{ color: actionStyle.border, fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px' }}>
            {actionStyle.icon} {actionStyle.label}
          </span>
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${actionStyle.border}`,
          borderRadius: '8px',
          padding: '6px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: '#e2e8f0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          <span style={{ color: 'var(--text-muted)', marginRight: '8px', fontSize: '11px' }}>L{lineNum}</span>
          {lineText || '···'}
        </div>
      </div>

      {/* ── Condition result banner ── */}
      <AnimatePresence mode="wait">
        {action === 'condition' && (
          <motion.div
            key={`cond-${step}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: conditionResult === true
                ? 'rgba(16, 185, 129, 0.12)'
                : conditionResult === false
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${conditionResult === true ? '#10b981' : conditionResult === false ? '#ef4444' : '#f59e0b'}`,
              borderRadius: '10px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <GitBranch size={16} color={conditionResult === true ? '#10b981' : '#ef4444'} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Condition</span>
            <code style={{ color: '#e2e8f0', flex: 1 }}>{conditionExpr}</code>
            {conditionResult === true && (
              <span style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> TRUE
              </span>
            )}
            {conditionResult === false && (
              <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <XCircle size={14} /> FALSE
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Variable Memory Cells ── */}
      {varEntries.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Memory
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <AnimatePresence>
              {allVarNames.filter(k => variables[k] !== undefined).map((k) => {
                const v = variables[k];
                const isArray = Array.isArray(v);
                const isObj = v !== null && typeof v === 'object' && !isArray;
                const displayVal = isArray
                  ? `[${v.map(x => JSON.stringify(x)).join(', ')}]`
                  : isObj
                    ? JSON.stringify(v)
                    : String(v);

                // Find previous value for change detection
                let prevVal = null;
                for (let i = step - 1; i >= 0; i--) {
                  const prev = trace[i]?.variables?.[k];
                  if (prev !== undefined) { prevVal = prev; break; }
                }
                const changed = prevVal !== null && String(prevVal) !== String(v);

                return (
                  <motion.div
                    key={k}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    style={{
                      background: changed
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'var(--bg-surface)',
                      border: `1.5px solid ${changed ? 'var(--accent-color)' : 'var(--border-glass)'}`,
                      borderRadius: '10px',
                      padding: '10px 16px',
                      minWidth: '80px',
                      maxWidth: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      boxShadow: changed ? '0 0 12px rgba(59,130,246,0.2)' : 'none',
                      transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {k}
                    </span>
                    <span style={{
                      color: changed ? 'var(--accent-color)' : '#e2e8f0',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '16px',
                      fontWeight: '700',
                      wordBreak: 'break-all'
                    }}>
                      {displayVal}
                    </span>
                    {changed && prevVal !== null && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <ArrowRight size={9} />
                        was: {String(prevVal)}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Execution Flow Timeline ── */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          Execution Flow
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
          {(trace || []).slice(Math.max(0, step - 6), step + 1).map((s, i, arr) => {
            const globalIdx = Math.max(0, step - 6) + i;
            const isCurrent = globalIdx === step;
            const sAction = s.action || 'assignment';
            const aStyle = actionColors[sAction] || actionColors.assignment;

            return (
              <motion.div
                key={globalIdx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: isCurrent ? aStyle.bg : 'transparent',
                  border: `1px solid ${isCurrent ? aStyle.border : 'transparent'}`,
                  opacity: isCurrent ? 1 : 0.45,
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ color: aStyle.border, fontSize: '10px', width: '14px', textAlign: 'center' }}>
                  {aStyle.icon}
                </span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', width: '24px' }}>
                  L{s.line}
                </span>
                <span style={{
                  color: isCurrent ? '#e2e8f0' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {s.line_text || '···'}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Output Panel (print statements) ── */}
      {outputs.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Output
          </div>
          <div style={{
            background: '#050505',
            border: '1px solid var(--border-glass)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px'
          }}>
            {outputs.map((out, i) => (
              <div key={i} style={{ color: '#a3e635', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{'>'}</span>
                <span>{out}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VariablesLayout;
