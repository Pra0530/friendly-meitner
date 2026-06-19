import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronRight, Clock, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InsightPanel = ({ insight }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!insight) return null;

  return (
    <div style={{ 
      background: 'rgba(59, 130, 246, 0.1)', 
      border: '1px solid rgba(59, 130, 246, 0.3)', 
      borderRadius: '8px', 
      marginBottom: '16px',
      overflow: 'hidden'
    }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          outline: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={18} color="#3b82f6" />
          <strong style={{ fontSize: '14px' }}>Algorithm Insight: {insight.pattern}</strong>
        </div>
        {isOpen ? <ChevronDown size={18} color="var(--text-secondary)" /> : <ChevronRight size={18} color="var(--text-secondary)" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: '12px', lineHeight: '1.5' }}>
                {insight.intuition}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} />
                  <span>Time: {insight.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Box size={14} />
                  <span>Space: {insight.space}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InsightPanel;
