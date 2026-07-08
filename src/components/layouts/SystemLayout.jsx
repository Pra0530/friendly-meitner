import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Zap, Folder, File, Code, GitBranch, Cloud } from 'lucide-react';

const getIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'server': return <Server size={24} />;
    case 'database': return <Database size={24} />;
    case 'cache': return <Zap size={24} />;
    case 'directory': return <Folder size={24} />;
    case 'file': return <File size={24} />;
    case 'repo': return <GitBranch size={24} />;
    case 'cloud': return <Cloud size={24} />;
    default: return <Code size={24} />;
  }
};

const getColor = (colorStr) => {
  switch (colorStr?.toLowerCase()) {
    case 'blue': return 'var(--accent-color)';
    case 'green': return 'var(--success-color)';
    case 'orange': return 'var(--warning-color)';
    case 'red': return 'var(--danger-color)';
    default: return 'var(--text-primary)';
  }
};

const SystemLayout = ({ initial_data, currentState }) => {
  const activeFlow = currentState?.active_flow;

  const { nodes, positions } = useMemo(() => {
    if (!initial_data || !Array.isArray(initial_data)) return { nodes: [], positions: {} };

    const pos = {};
    const n = initial_data.length;
    const spacing = 600 / (n + 1);
    
    initial_data.forEach((node, i) => {
      pos[node.id] = {
        x: spacing * (i + 1) - 40, // 80px width / 2
        y: 160 // centered vertically
      };
    });

    return { nodes: initial_data, positions: pos };
  }, [initial_data]);

  return (
    <div style={{ position: 'relative', width: '600px', height: '400px', margin: '0 auto' }}>
      
      {/* SVG for Arrows and Data Flow */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted)" />
          </marker>
          <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-color)" />
          </marker>
        </defs>

        {activeFlow && positions[activeFlow.from] && positions[activeFlow.to] && (
          <g>
            {/* Base Arrow */}
            <line
              x1={positions[activeFlow.from].x + 40}
              y1={positions[activeFlow.from].y + 40}
              x2={positions[activeFlow.to].x + 40}
              y2={positions[activeFlow.to].y + 40}
              stroke="var(--accent-color)"
              strokeWidth="2"
              markerEnd="url(#arrowhead-active)"
              strokeDasharray="4 4"
            />
            
            {/* Animated Packet */}
            <circle r="4" fill="var(--accent-color)">
              <animateMotion 
                dur="1s" 
                repeatCount="indefinite"
                path={`M ${positions[activeFlow.from].x + 40},${positions[activeFlow.from].y + 40} L ${positions[activeFlow.to].x + 40},${positions[activeFlow.to].y + 40}`}
              />
            </circle>

            {/* Label */}
            <text
              x={(positions[activeFlow.from].x + positions[activeFlow.to].x) / 2 + 40}
              y={(positions[activeFlow.from].y + positions[activeFlow.to].y) / 2 + 30}
              fill="var(--accent-color)"
              fontSize="12"
              textAnchor="middle"
              fontWeight="bold"
            >
              {activeFlow.label}
            </text>
          </g>
        )}
      </svg>

      {/* Nodes */}
      {nodes.map(node => {
        const p = positions[node.id];
        if (!p) return null;

        const isSource = activeFlow?.from === node.id;
        const isTarget = activeFlow?.to === node.id;
        const nodeColor = getColor(node.color);

        return (
          <div key={node.id} style={{ position: 'absolute', left: p.x, top: p.y, zIndex: 5 }}>
            <motion.div 
              className="data-node"
              layout
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: \`2px solid \${nodeColor}\`,
                background: 'var(--bg-surface)',
                boxShadow: isSource || isTarget ? \`0 0 20px \${nodeColor}40\` : '0 4px 12px rgba(0,0,0,0.3)',
                color: nodeColor,
                transition: 'all 0.3s ease',
                gap: '8px'
              }}
            >
              {getIcon(node.type)}
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{node.label}</span>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default SystemLayout;
