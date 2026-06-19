import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { dsaQuestions } from '../data/dsaQuestions';

const QuestionBank = ({ isOpen, onClose, onSelectQuestion }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40,
              backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, bottom: 0,
              width: '350px',
              backgroundColor: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-glass)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '4px 0 20px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              padding: '20px',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={20} color="var(--accent-color)" />
                <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>DSA 100</h2>
              </div>
              <button className="icon-button" onClick={onClose}>
                <X size={20} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {dsaQuestions.map((categoryObj) => {
                const isExpanded = expandedCategory === categoryObj.category;
                return (
                  <div key={categoryObj.category} style={{ marginBottom: '12px' }}>
                    <button
                      onClick={() => toggleCategory(categoryObj.category)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: isExpanded ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        border: '1px solid',
                        borderColor: isExpanded ? 'var(--accent-color)' : 'var(--border-glass)',
                        borderRadius: '8px',
                        color: isExpanded ? 'var(--accent-color)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: isExpanded ? 'bold' : 'normal'
                      }}
                    >
                      <span style={{ fontSize: '15px' }}>{categoryObj.category}</span>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '8px 0 8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {categoryObj.questions.map((q, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  onSelectQuestion(q);
                                  onClose();
                                }}
                                style={{
                                  textAlign: 'left',
                                  padding: '8px 12px',
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-secondary)',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  borderRadius: '4px',
                                  transition: 'background 0.2s, color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                  e.target.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'transparent';
                                  e.target.style.color = 'var(--text-secondary)';
                                }}
                              >
                                {q.title || q}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuestionBank;
