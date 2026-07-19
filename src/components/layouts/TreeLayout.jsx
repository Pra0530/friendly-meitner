import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dagre from 'dagre';

const POINTER_COLORS = ['var(--accent-color)', 'var(--success-color)', 'var(--warning-color)', 'var(--danger-color)'];

const TreeLayout = ({ initial_data, root_id, pointers, currentState }) => {
  const visitedNodes = currentState?.visited_nodes || [];
  const visitedEdges = currentState?.visited_edges || [];

  const { nodes, edges, positions } = useMemo(() => {
    if (!initial_data || !Array.isArray(initial_data)) return { nodes: [], edges: [], positions: {} };

    const nodeMap = {};
    initial_data.forEach(n => nodeMap[n.id] = n);

    const edgeList = [];
    const pos = {};
    const visited = new Set();

    // Helper to calculate coordinates recursively
    const layoutTree = (nodeId, x, y, level) => {
      if (!nodeId || visited.has(nodeId) || !nodeMap[nodeId]) return;
      visited.add(nodeId);

      const node = nodeMap[nodeId];
      pos[nodeId] = { x, y };

      // Horizontal offset decreases as tree depth increases to prevent subtree overlap
      const offset = 140 / Math.pow(1.5, level);

      if (node.left && nodeMap[node.left]) {
        edgeList.push({ from: nodeId, to: node.left });
        layoutTree(node.left, x - offset, y + 80, level + 1);
      }
      if (node.right && nodeMap[node.right]) {
        edgeList.push({ from: nodeId, to: node.right });
        layoutTree(node.right, x + offset, y + 80, level + 1);
      }
    };

    const rootId = root_id || (initial_data.length > 0 ? initial_data[0].id : null);
    if (rootId) {
      // Center the root at x = 300, y = 40 (inside 600px container)
      layoutTree(rootId, 300, 40, 1);
    }

    return { nodes: initial_data, edges: edgeList, positions: pos };
  }, [initial_data, root_id]);

  return (
    <div style={{ position: 'relative', width: '600px', height: '360px', margin: '0 auto', overflow: 'hidden' }}>
      
      {/* SVG for Edges */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        {edges.map((edge, i) => {
          const fromPos = positions[edge.from];
          const toPos = positions[edge.to];
          if (!fromPos || !toPos) return null;
          
          const isVisited = visitedEdges.some(e => 
            (e[0] === edge.from && e[1] === edge.to) || 
            (e[1] === edge.from && e[0] === edge.to)
          );
          
          return (
            <line 
              key={i}
              x1={fromPos.x + 24} // Center of 48px node
              y1={fromPos.y + 24} 
              x2={toPos.x + 24} 
              y2={toPos.y + 24} 
              stroke={isVisited ? "var(--success-color)" : "var(--border-glass)"}
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

        const activePointers = Array.isArray(pointers)
          ? pointers.filter(p => p.target === node.id).map(p => [p.name, p.target])
          : Object.entries(pointers).filter(([_, pId]) => pId === node.id);
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
                      top: `-${30 + pIndex * 26}px`, // Stack pointers to avoid overlap
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
                borderRadius: '50%',
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
              {node.val}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default TreeLayout;
