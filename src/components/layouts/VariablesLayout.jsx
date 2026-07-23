import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
        let out = m[1].replace(/["']/g, '');
        const sv = s.variables?.[out.trim()];
        if (sv !== undefined) out = String(sv);
        outputs.push(out);
      }
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-5 py-2 px-0.5 overflow-hidden font-sans">
      
      {/* ── Condition Evaluation (True/False Branches) ── */}
      <AnimatePresence mode="wait">
        {action === 'condition' && (
          <motion.div
            key={`cond-${step}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center justify-center gap-5 shrink-0"
          >
            {/* TRUE branch card */}
            <motion.div
              animate={{
                scale: condResult === true ? 1.08 : 0.94,
                opacity: condResult === false ? 0.3 : 1,
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`rounded-xl px-7 py-3.5 text-center border-2 transition-all duration-200 ${
                condResult === true 
                  ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
                  : 'bg-emerald-950/20 border-emerald-900/30'
              }`}
            >
              <div className="text-xl mb-1">✓</div>
              <div className="text-emerald-400 font-bold text-sm tracking-wide">TRUE</div>
            </motion.div>

            {/* Expression description */}
            <div className="text-center max-w-[180px]">
              <div className="text-neutral-500 text-[10px] uppercase tracking-wider mb-1">evaluating</div>
              <code className="text-amber-400 font-mono text-sm font-semibold block overflow-hidden text-ellipsis whitespace-nowrap">
                {lineText}
              </code>
            </div>

            {/* FALSE branch card */}
            <motion.div
              animate={{
                scale: condResult === false ? 1.08 : 0.94,
                opacity: condResult === true ? 0.3 : 1,
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`rounded-xl px-7 py-3.5 text-center border-2 transition-all duration-200 ${
                condResult === false 
                  ? 'bg-rose-500/10 border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]' 
                  : 'bg-rose-950/20 border-rose-900/30'
              }`}
            >
              <div className="text-xl mb-1">✗</div>
              <div className="text-rose-400 font-bold text-sm tracking-wide">FALSE</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Memory Panel (Variable grids) ── */}
      {cleanVars.length > 0 && (
        <div className="shrink-0 flex flex-col gap-2.5">
          <div className="text-[10px] text-neutral-500 tracking-widest uppercase font-semibold">
            Memory Scope
          </div>
          <div className="flex flex-wrap gap-3">
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
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                  >
                    <Card 
                      className={`relative min-w-[100px] border transition-all duration-300 ${
                        changed 
                          ? 'bg-blue-600/10 border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                          : 'bg-neutral-900/40 border-neutral-800'
                      }`}
                    >
                      {/* Swipe-shimmer on value change */}
                      {changed && (
                        <motion.div
                          initial={{ x: '-100%' }}
                          animate={{ x: '150%' }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/15 to-transparent pointer-events-none"
                        />
                      )}
                      
                      <CardContent className="p-3 flex flex-col justify-between">
                        <div className="text-neutral-500 text-[10px] font-mono tracking-wider uppercase mb-1">
                          {k}
                        </div>
                        
                        <motion.div
                          key={`${k}-${String(v)}`}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`font-mono text-lg font-extrabold leading-none ${
                            changed ? 'text-blue-400' : 'text-neutral-200'
                          }`}
                        >
                          {display}
                        </motion.div>
                        
                        {changed && prev !== undefined && (
                          <div className="text-neutral-600 text-[10px] font-mono line-through mt-1.5 opacity-80">
                            was {String(prev)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Console Output Panel ── */}
      {outputs.length > 0 && (
        <div className="shrink-0 flex flex-col gap-2.5">
          <div className="text-[10px] text-neutral-500 tracking-widest uppercase font-semibold">
            Console stdout
          </div>
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-3.5 font-mono flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
            {outputs.map((o, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex gap-2.5 text-lime-400 text-[13px] leading-relaxed"
              >
                <span className="text-neutral-600 select-none">&gt;</span>
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
