import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INTERNAL = new Set([
  'trace_steps','tracer','sys','json','object_ids','all_nodes',
  'get_object_id','serialize_val','user_code_lines','user_code',
  'blocked_modules','_pyodide_core','builtins','INTERNAL_NAMES',
  'flat_nodes','result','mod','__name__','__doc__','__builtins__'
]);

const VariablesLayout = ({ currentState, trace, step }) => {
  const vars = currentState?.variables || {};
  const action = currentState?.action || 'assignment';
  const lineText = currentState?.line_text || '';

  // Clean variables
  const cleanVars = Object.entries(vars).filter(
    ([k]) => !INTERNAL.has(k) && !k.startsWith('__')
  );

  // Detect prev values for change animation
  const getPrev = (key) => {
    for (let i = step - 1; i >= 0; i--) {
      const v = trace[i]?.variables?.[key];
      if (v !== undefined) return v;
    }
    return undefined;
  };

  // Condition result: look at next step depth
  let condResult = null;
  if (action === 'condition') {
    const next = trace[step + 1];
    const curr = trace[step];
    if (next && curr) condResult = next.depth >= curr.depth;
  }

  // Collect all outputs seen so far (print calls)
  const outputs = [];
  for (let i = 0; i <= step; i++) {
    const s = trace[i];
    if (s?.action === 'call' && s?.line_text?.includes('print(')) {
      const m = s.line_text.match(/print\((.+)\)/);
      if (m) {
        // Evaluate using current variables at that step
        let out = m[1].replace(/["']/g, '');
        // Check if it's a variable reference
        const sv = s.variables?.[out.trim()];
        if (sv !== undefined) out = String(sv);
        outputs.push(out);
      }
    }
  }

  const actionMeta = {
    assignment: { color: '#60a5fa', label: 'ASSIGN',   bg: 'rgba(96,165,250,0.10)' },
    condition:  { color: '#fbbf24', label: 'CONDITION', bg: 'rgba(251,191,36,0.10)' },
    loop:       { color: '#a78bfa', label: 'LOOP',      bg: 'rgba(167,139,250,0.10)' },
    call:       { color: '#34d399', label: 'CALL',      bg: 'rgba(52,211,153,0.10)' },
    return:     { color: '#f87171', label: 'RETURN',    bg: 'rgba(248,113,113,0.10)' },
  };
  const meta = actionMeta[action] || actionMeta.assignment;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '8px 2px',
      overflow: 'hidden'
    }}>

      {/* ── Condition TRUE / FALSE ── */}
      <AnimatePresence mode="wait">
        {action === 'condition' && (
          <motion.div
            key={`cond-${step}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              flexShrink: 0
            }}
          >
            {/* TRUE branch */}
            <motion.div
              animate={{
                scale: condResult === true ? 1.12 : 0.9,
                opacity: condResult === false ? 0.25 : 1,
              }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'rgba(52,211,153,0.15)',
                border: `2px solid ${condResult === true ? '#34d399' : 'rgba(52,211,153,0.2)'}`,
                borderRadius: '12px',
                padding: '14px 28px',
                textAlign: 'center',
                boxShadow: condResult === true ? '0 0 24px rgba(52,211,153,0.35)' : 'none'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>✓</div>
              <div style={{ color: '#34d399', fontWeight: '700', fontSize: '15px' }}>TRUE</div>
            </motion.div>

            {/* Condition expression */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>evaluating</div>
              <code style={{
                color: '#fbbf24',
                fontFamily: 'var(--font-mono)',
                fontSize: '15px',
                fontWeight: '600',
                display: 'block',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {lineText}
              </code>
            </div>

            {/* FALSE branch */}
            <motion.div
              animate={{
                scale: condResult === false ? 1.12 : 0.9,
                opacity: condResult === true ? 0.25 : 1,
              }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'rgba(248,113,113,0.15)',
                border: `2px solid ${condResult === false ? '#f87171' : 'rgba(248,113,113,0.2)'}`,
                borderRadius: '12px',
                padding: '14px 28px',
                textAlign: 'center',
                boxShadow: condResult === false ? '0 0 24px rgba(248,113,113,0.35)' : 'none'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>✗</div>
              <div style={{ color: '#f87171', fontWeight: '700', fontSize: '15px' }}>FALSE</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Memory Cells (Variable Boxes) ── */}
      {cleanVars.length > 0 && (
        <div style={{ flexShrink: 0 }}>
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            Memory
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <AnimatePresence>
              {cleanVars.map(([k, v]) => {
                const prev = getPrev(k);
                const changed = prev !== undefined && String(prev) !== String(v);
                const isArray = Array.isArray(v);
                const display = isArray
                  ? `[${v.map(x => JSON.stringify(x)).join(', ')}]`
                  : String(v);

                return (
                  <motion.div
                    key={k}
                    layout
                    initial={{ opacity: 0, scale: 0.7, y: 20 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      borderColor: changed ? '#60a5fa' : 'rgba(255,255,255,0.08)',
                      boxShadow: changed ? '0 0 20px rgba(96,165,250,0.4)' : '0 0 0px transparent'
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                    style={{
                      background: changed ? 'rgba(96,165,250,0.08)' : 'var(--bg-surface)',
                      border: `2px solid ${changed ? '#60a5fa' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '12px',
                      padding: '12px 20px',
                      minWidth: '80px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Animated shimmer when changed */}
                    {changed && (
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 0.6 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.2), transparent)',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                    <div style={{
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: '4px'
                    }}>
                      {k}
                    </div>
                    <motion.div
                      key={`${k}-${String(v)}`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        color: changed ? '#60a5fa' : '#e2e8f0',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '20px',
                        fontWeight: '800',
                        lineHeight: 1
                      }}
                    >
                      {display}
                    </motion.div>
                    {changed && prev !== undefined && (
                      <div style={{
                        color: 'var(--text-muted)',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        marginTop: '4px',
                        textDecoration: 'line-through',
                        opacity: 0.6
                      }}>
                        {String(prev)}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Output (print results) ── */}
      {outputs.length > 0 && (
        <div style={{ flexShrink: 0 }}>
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            Output
          </div>
          <div style={{
            background: '#050507',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {outputs.map((o, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', gap: '10px', color: '#a3e635', fontSize: '14px' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{'>'}</span>
                <span>{o}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VariablesLayout;
