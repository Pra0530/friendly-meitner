import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const POINTER_COLORS = ['var(--accent-color)', 'var(--success-color)', 'var(--warning-color)', 'var(--danger-color)'];

const TreeLayout = ({ initial_data, root_id, pointers }) => {
  const { nodes, edges, positions } = useMemo(() => {
    if (!initial_data || !Array.isArray(initial_data)) return { nodes: [], edges: [], positions: {} };

    const nodeMap = {};
    initial_data.forEach(n => nodeMap[n.id] = n);

    const pos = {};
    const edgeList = [];
    
    // Recursive function to assign positions
    const traverse = (nodeId, x, y, horizontalSpacing) => {
      if (!nodeId || !nodeMap[nodeId]) return;
      
      pos[nodeId] = { x, y };
      
      const node = nodeMap[nodeId];
      if (node.left) {
        edgeList.push({ from: nodeId, to: node.left });
        traverse(node.left, x - horizontalSpacing, y + 80, horizontalSpacing / 1.8);
      }
      if (node.right) {
        edgeList.push({ from: nodeId, to: node.right });
        traverse(node.right, x + horizontalSpacing, y + 80, horizontalSpacing / 1.8);
      }
    };

    if (root_id) {
      traverse(root_id, 300, 40, 120); // Center of 600px canvas
    }

    return { nodes: initial_data, edges: edgeList, positions: pos };
  }, [initial_data, root_id]);

  return (
    <div style={{ position: 'relative', width: '600px', height: '400px', margin: '0 auto' }}>
      
      {/* SVG for Edges */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        {edges.map((edge, i) => {
          const fromPos = positions[edge.from];
          const toPos = positions[edge.to];
          if (!fromPos || !toPos) return null;
          return (
            <line 
              key={i}
              x1={fromPos.x + 24} // center of 48px node
              y1={fromPos.y + 24} 
              x2={toPos.x + 24} 
              y2={toPos.y + 24} 
              stroke="var(--text-muted)"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      {/* Nodes and Pointers */}
      {nodes.map(node => {
        const p = positions[node.id];
        if (!p) return null;

        const activePointers = Object.entries(pointers).filter(([_, pId]) => pId === node.id);
        const isHighlighted = activePointers.length > 0;

        return (
          <div key={node.id} style={{ position: 'absolute', left: p.x, top: p.y, zIndex: 5 }}>
            
            {activePointers.map(([pName], pIndex) => {
              const color = POINTER_COLORS[pIndex % POINTER_COLORS.length];
              return (
                <AnimatePresence key={pName}>
                  <motion.div 
                    layoutId={`pointer-${pName}`}
                    className="pointer-label"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    style={{ 
                      left: '24px', 
                      marginLeft: '-24px',
                      top: `-${30 + pIndex * 26}px`, // Stack upwards to prevent overlap
                      color: color,
                      background: `color-mix(in srgb, ${color} 15%, transparent)`,
                      borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                      zIndex: 10
                    }}
                  >
                    {pName}
                  </motion.div>
                </AnimatePresence>
              );
            })}

            <motion.div 
              className={`data-node ${isHighlighted ? 'highlighted' : ''}`}
              layout
              style={{
                width: '48px',
                height: '48px',
                minWidth: '48px',
                borderRadius: '50%', // Circle for trees
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--border-glass)',
                background: 'var(--bg-surface)',
                boxShadow: isHighlighted ? '0 0 20px var(--accent-glow)' : '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {node.val}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default TreeLayout;
