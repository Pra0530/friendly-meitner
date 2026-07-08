import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const POINTER_COLORS = ['var(--accent-color)', 'var(--success-color)', 'var(--warning-color)', 'var(--danger-color)'];

const GraphLayout = ({ initial_data, pointers, currentState }) => {
  const visitedNodes = currentState?.visited_nodes || [];
  const visitedEdges = currentState?.visited_edges || [];

  const { nodes, edges, positions } = useMemo(() => {
    if (!initial_data || !initial_data.nodes || !initial_data.edges) return { nodes: [], edges: [], positions: {} };

    const nodesList = initial_data.nodes;
    const edgeList = initial_data.edges;
    const pos = {};

    // Circular layout
    const centerX = 300;
    const centerY = 200;
    const radius = 120;
    const n = nodesList.length;

    nodesList.forEach((node, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2; // start at top
      pos[node.id] = {
        x: centerX + radius * Math.cos(angle) - 24, // subtract half width to center
        y: centerY + radius * Math.sin(angle) - 24
      };
    });

    return { nodes: nodesList, edges: edgeList, positions: pos };
  }, [initial_data]);

  return (
    <div style={{ position: 'relative', width: '600px', height: '400px', margin: '0 auto' }}>
      
      {/* SVG for Edges */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        {edges.map((edge, i) => {
          const fromPos = positions[edge[0]];
          const toPos = positions[edge[1]];
          if (!fromPos || !toPos) return null;
          
          const isVisited = visitedEdges.some(e => 
            (e[0] === edge[0] && e[1] === edge[1]) || 
            (e[1] === edge[0] && e[0] === edge[1])
          );
          
          return (
            <line 
              key={i}
              x1={fromPos.x + 24} // center of 48px node
              y1={fromPos.y + 24} 
              x2={toPos.x + 24} 
              y2={toPos.y + 24} 
              stroke={isVisited ? "var(--success-color)" : "var(--text-muted)"}
              strokeWidth={isVisited ? "4" : "2"}
              style={{ transition: 'all 0.3s ease' }}
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
        const isVisited = visitedNodes.includes(node.id);

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
                borderRadius: '50%', // Circle for graphs
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isVisited ? '2px solid var(--success-color)' : '2px solid var(--border-glass)',
                background: isVisited ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-surface)',
                boxShadow: isHighlighted ? '0 0 20px var(--accent-glow)' : '0 4px 12px rgba(0,0,0,0.3)',
                color: isVisited ? 'var(--success-color)' : 'var(--text-primary)',
                transition: 'all 0.3s ease'
              }}
            >
              {node.val || node.id}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default GraphLayout;
