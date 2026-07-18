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
    const visited = new Set();

    // Helper to traverse and collect edges (to avoid cycles causing infinite recursion)
    const collectEdges = (nodeId) => {
      if (!nodeId || visited.has(nodeId) || !nodeMap[nodeId]) return;
      visited.add(nodeId);

      const node = nodeMap[nodeId];
      if (node.left && nodeMap[node.left]) {
        edgeList.push({ from: nodeId, to: node.left });
        collectEdges(node.left);
      }
      if (node.right && nodeMap[node.right]) {
        edgeList.push({ from: nodeId, to: node.right });
        collectEdges(node.right);
      }
    };

    if (root_id) {
      collectEdges(root_id);
    } else if (initial_data.length > 0) {
      // Fallback: collect edges from first node
      collectEdges(initial_data[0].id);
    }

    // Configure dagre layout
    const g = new dagre.graphlib.Graph();
    g.setGraph({ 
      rankdir: 'TB', 
      nodesep: 40, 
      ranksep: 60,
      marginx: 50,
      marginy: 50
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes to graph
    initial_data.forEach(node => {
      g.setNode(node.id, { width: 48, height: 48 });
    });

    // Add edges to graph
    edgeList.forEach(edge => {
      g.setEdge(edge.from, edge.to);
    });

    // Run layout computation
    dagre.layout(g);

    const pos = {};
    g.nodes().forEach(v => {
      const nodeLayout = g.node(v);
      if (nodeLayout) {
        pos[v] = {
          x: nodeLayout.x - 24, // Center offset
          y: nodeLayout.y - 24
        };
      }
    });

    return { nodes: initial_data, edges: edgeList, positions: pos };
  }, [initial_data, root_id]);

  return (
    <div style={{ position: 'relative', width: '600px', height: '400px', margin: '0 auto', overflow: 'auto' }}>
      
      {/* SVG for Edges */}
      <svg style={{ position: 'absolute', inset: 0, width: '1000px', height: '1000px', pointerEvents: 'none', zIndex: 1 }}>
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
