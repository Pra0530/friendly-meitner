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
  const pEntries = Array.isArray(pointers)
    ? pointers.map(p => {
        const coords = p.target.split('-').map(Number);
        return [p.name, coords];
      })
    : Object.entries(pointers);

  pEntries.forEach(([pName, coords]) => {
    if (Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      const key = `${coords[0]},${coords[1]}`;
      if (!cellPointers[key]) cellPointers[key] = [];
      cellPointers[key].push(pName);
    }
  });

  const pNamesList = Array.isArray(pointers) ? pointers.map(p => p.name) : Object.keys(pointers);

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
            const isHighlighted = activePointers.length > 0;

            const cellStyle = {
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-surface)',
              borderRadius: '6px',
              position: 'relative',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)',
              transition: 'all 0.2s ease',
              boxShadow: isHighlighted ? '0 0 10px rgba(34, 197, 94, 0.4)' : 'none'
            };

            // If a pointer is on this cell, give it a prominent border
            if (activePointers.length > 0) {
              const pIndex = pNamesList.indexOf(activePointers[0]);
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
                      const pIdx = pNamesList.indexOf(pName);
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
