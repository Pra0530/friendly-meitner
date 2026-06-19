import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const POINTER_COLORS = ['var(--accent-color)', 'var(--success-color)', 'var(--warning-color)', 'var(--danger-color)'];

const ArrayLayout = ({ initial_data, pointers, layout_type, traceHistory = [] }) => {
  if (!Array.isArray(initial_data)) return <div style={{ color: 'var(--danger-color)' }}>Invalid Data Format</div>;
  let minPriceIdx = -1;
  let maxProfitIdx = -1;
  let maxVisitedIdx = -1;

  traceHistory.forEach(t => {
    const activeP = t.pointers ? Object.values(t.pointers).find(v => v !== null && v !== -1) : null;
    if (activeP !== undefined && activeP !== null) {
      maxVisitedIdx = Math.max(maxVisitedIdx, activeP);
    }
    
    if (t.reasonTag === 'new-min' && activeP !== undefined && activeP !== null) {
      minPriceIdx = activeP;
    }
    if (t.reasonTag === 'new-max-profit' && activeP !== undefined && activeP !== null) {
      maxProfitIdx = activeP;
    }
  });

  return (
    <div style={{ 
      display: 'flex', 
      gap: layout_type === 'ARRAY' ? '0px' : '24px', 
      position: 'relative', 
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%'
    }}>
      {initial_data.map((val, idx) => {
        const activePointers = Object.entries(pointers).filter(([_, pIdx]) => pIdx === idx);
        
        let nodeStyle = {
          borderRadius: layout_type === 'ARRAY' ? '0px' : '12px',
          borderLeftWidth: layout_type === 'ARRAY' && idx > 0 ? '0px' : '2px',
          minWidth: '64px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--border-glass)',
          background: 'var(--bg-surface)',
          transition: 'all 0.3s ease',
          opacity: 1
        };

        if (idx > maxVisitedIdx) {
          nodeStyle.opacity = 0.3; // gray out unvisited
        }
        
        if (idx === minPriceIdx) {
          nodeStyle.border = '2px solid #3b82f6'; // blue border
          nodeStyle.boxShadow = '0 0 10px rgba(59, 130, 246, 0.3)';
        }
        
        if (idx === maxProfitIdx) {
          nodeStyle.background = 'rgba(34, 197, 94, 0.2)'; // green fill
          nodeStyle.border = '2px solid #22c55e';
        }

        return (
          <React.Fragment key={idx}>
            <div style={{ position: 'relative' }}>

              
              {activePointers.map(([pName], pIndex) => {
                const color = POINTER_COLORS[pIndex % POINTER_COLORS.length];
                const isTop = pIndex % 2 === 0;
                
                return (
                  <AnimatePresence key={pName}>
                    <motion.div 
                      layoutId={`pointer-${pName}`}
                      className="pointer-label"
                      initial={{ opacity: 0, y: isTop ? -10 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      style={{ 
                        left: '50%', 
                        marginLeft: '-24px',
                        top: isTop ? '-35px' : 'auto',
                        bottom: isTop ? 'auto' : '-35px',
                        color: color,
                        display: 'flex',
                        flexDirection: isTop ? 'column-reverse' : 'column',
                        alignItems: 'center',
                        gap: '4px',
                        zIndex: 10,
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}
                    >
                      {isTop ? <span>↓</span> : <span>↑</span>}
                      {pName}
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

            {layout_type === 'LINKED_LIST' && idx < initial_data.length - 1 && (
              <div style={{ width: '40px', height: '2px', background: 'var(--text-muted)', position: 'relative', margin: '0 4px' }}>
                <div style={{ position: 'absolute', right: '0px', top: '-4px', width: '10px', height: '10px', borderTop: '2px solid var(--text-muted)', borderRight: '2px solid var(--text-muted)', transform: 'rotate(45deg)' }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ArrayLayout;
