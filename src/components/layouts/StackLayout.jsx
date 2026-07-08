import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const POINTER_COLORS = ['var(--accent-color)', 'var(--success-color)', 'var(--warning-color)', 'var(--danger-color)'];

const StackLayout = ({ initial_data, pointers, traceHistory = [] }) => {
  if (!Array.isArray(initial_data)) return <div style={{ color: 'var(--danger-color)' }}>Invalid Data Format</div>;
  
  let maxVisitedIdx = -1;
  traceHistory.forEach(t => {
    const activeP = t.pointers ? Object.values(t.pointers).find(v => v !== null && v !== -1) : null;
    if (activeP !== undefined && activeP !== null) {
      maxVisitedIdx = Math.max(maxVisitedIdx, activeP);
    }
  });

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column-reverse', // To make index 0 at the bottom like a real stack
      gap: '0px', 
      position: 'relative', 
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      padding: '24px 0'
    }}>
      {initial_data.map((val, idx) => {
        const activePointers = Object.entries(pointers).filter(([_, pIdx]) => pIdx === idx);
        
        let nodeStyle = {
          minWidth: '80px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--border-glass)',
          borderBottomWidth: idx > 0 ? '0px' : '2px', // only the bottom most gets bottom border since it's column-reverse
          background: 'var(--bg-surface)',
          transition: 'all 0.3s ease',
          opacity: 1
        };

        if (idx > maxVisitedIdx) {
          nodeStyle.opacity = 0.3; // gray out unvisited
        }
        
        return (
          <React.Fragment key={idx}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              
              {/* Pointers pointing to the left side of the stack elements */}
              {activePointers.map(([pName], pIndex) => {
                const color = POINTER_COLORS[pIndex % POINTER_COLORS.length];
                
                return (
                  <AnimatePresence key={pName}>
                    <motion.div 
                      layoutId={`pointer-${pName}`}
                      className="pointer-label"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      style={{ 
                        position: 'absolute',
                        right: 'calc(100% + 12px)',
                        color: color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        zIndex: 10,
                        fontWeight: 'bold',
                        fontSize: '14px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {pName} <span>→</span>
                    </motion.div>
                  </AnimatePresence>
                );
              })}

              <motion.div 
                className="data-node"
                layout
                style={nodeStyle}
              >
                {val}
              </motion.div>
            </div>
          </React.Fragment>
        );
      })}
      
      {/* Bottom line for stack base */}
      <div style={{ width: '120px', height: '4px', background: 'var(--border-glass)', borderRadius: '2px', marginTop: '2px' }} />
    </div>
  );
};

export default StackLayout;
