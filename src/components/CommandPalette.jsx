import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileCode, CornerDownLeft } from 'lucide-react';
import { dsaQuestions } from '../data/dsaQuestions';

const CommandPalette = ({ isOpen, onClose, onSelectQuestion }) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Flatten categories into an array of questions
  const allQuestions = Object.entries(dsaQuestions).flatMap(([category, list]) => 
    list.map(q => ({
      ...q,
      category
    }))
  );

  // Filter matching queries
  const filtered = allQuestions.filter(q => 
    q.title.toLowerCase().includes(query.toLowerCase()) ||
    q.category.toLowerCase().includes(query.toLowerCase())
  );

  // Reset selection index on search change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input automatically on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
      setQuery("");
    }
  }, [isOpen]);

  // Keyboard navigation inside list
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onSelectQuestion(filtered[selectedIndex]);
        onClose();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 999,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '80px',
          backdropFilter: 'blur(4px)'
        }}>
          {/* Backdrop Click */}
          <div style={{ position: 'absolute', inset: 0, zIndex: -1 }} onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            style={{
              width: '100%',
              maxWidth: '600px',
              height: 'fit-content',
              maxHeight: '400px',
              backgroundColor: '#18181b',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Search Input Gutter */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-glass)',
              gap: '12px'
            }}>
              <Search size={18} color="var(--text-secondary)" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search files, catalogue, and categories... (e.g. Tree, DFS, Binary)"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-sans)'
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', padding: '2px 6px', borderRadius: '4px' }}>ESC</span>
            </div>

            {/* Results Gutter */}
            <div 
              ref={listRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 0',
                maxHeight: '300px'
              }}
            >
              {filtered.length === 0 ? (
                <div style={{ padding: '16px', textHeight: '1.5', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '14px' }}>
                  No matching items found
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isActive = idx === selectedIndex;
                  return (
                    <div
                      key={item.title}
                      onClick={() => {
                        onSelectQuestion(item);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                        borderLeft: `3px solid ${isActive ? 'var(--accent-color)' : 'transparent'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileCode size={16} color={isActive ? "var(--accent-color)" : "var(--text-secondary)"} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>
                            {item.title}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'capitalize' }}>
                            {item.category.replace(/([A-Z])/g, ' $1')}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '11px' }}>
                          <span>select</span>
                          <CornerDownLeft size={10} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
