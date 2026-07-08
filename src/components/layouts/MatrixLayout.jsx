import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const POINTER_COLORS = ['var(--accent-color)', 'var(--warning-color)', '#ec4899', '#8b5cf6'];

const MatrixLayout = ({ initial_data, pointers, currentState }) => {
  // If the trace step provided an updated matrix state, use it. Otherwise fallback to initial_data.
  const matrix = currentState?.matrix_state || initial_data;
  
  if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) {
    return <div style={{ color: 'var(--danger-color)' }}>Invalid Matrix Data</div>;
  }

  const numRows = matrix.length;
  const numCols = matrix[0].length;

  // Process pointers: group them by cell coordinates [row, col]
  const cellPointers = {}; // key: "row,col", value: [pointer names...]
  Object.entries(pointers).forEach(([pName, coords]) => {
    if (Array.isArray(coords) && coords.length === 2) {
      const key = `${coords[0]},${coords[1]}`;
      if (!cellPointers[key]) cellPointers[key] = [];
      cellPointers[key].push(pName);
    }
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%'
    }}>
      {matrix.map((row, rIdx) => (
        <div key={rIdx} style={{ display: 'flex', gap: '8px' }}>
          {row.map((val, cIdx) => {
            const key = `${rIdx},${cIdx}`;
            const activePointers = cellPointers[key] || [];
            
            // "Star" logic for highlighting
            const isHighlighted = val === "*" || val === 1 || val === "1" || val === true || val === "true";
            
            let cellStyle = {
              position: 'relative',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)',
              background: isHighlighted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 0, 0, 0.2)', // Green or dark
              color: isHighlighted ? 'var(--success-color)' : 'var(--text-secondary)',
              fontWeight: isHighlighted ? 'bold' : 'normal',
              fontSize: '18px',
              transition: 'all 0.3s ease',
              boxShadow: isHighlighted ? '0 0 10px rgba(34, 197, 94, 0.4)' : 'none'
            };

            // If a pointer is on this cell, give it a prominent border
            if (activePointers.length > 0) {
              const pIndex = Object.keys(pointers).indexOf(activePointers[0]);
              const color = POINTER_COLORS[pIndex % POINTER_COLORS.length];
              cellStyle.border = `2px solid ${color}`;
              cellStyle.boxShadow = `0 0 12px ${color}80`; // 50% opacity hex
            }

            return (
              <motion.div 
                key={cIdx} 
                layout
                style={cellStyle}
              >
                {val}
                
                {/* Pointer Labels Badge */}
                {activePointers.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    display: 'flex',
                    gap: '4px',
                    zIndex: 10
                  }}>
                    {activePointers.map((pName, i) => {
                      const pIdx = Object.keys(pointers).indexOf(pName);
                      const color = POINTER_COLORS[pIdx % POINTER_COLORS.length];
                      return (
                        <motion.div
                          key={pName}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{
                            background: color,
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                          }}
                        >
                          {pName}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MatrixLayout;
