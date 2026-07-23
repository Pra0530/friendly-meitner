import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { dsaQuestions } from '../data/dsaQuestions';
import { Button } from '@/components/ui/button';

const QuestionBank = ({ isOpen, onClose, onSelectQuestion }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Left Slide-in Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 220 }}
            className="fixed top-0 left-0 bottom-0 w-[350px] bg-neutral-900 border-r border-neutral-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-blue-500" />
                <h2 className="text-lg font-bold text-neutral-100 font-sans m-0">DSA Catalogue</h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* Question Categories List */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3 scrollbar-thin">
              {dsaQuestions.map((categoryObj) => {
                const isExpanded = expandedCategory === categoryObj.category;
                return (
                  <div key={categoryObj.category} className="flex flex-col gap-1">
                    <Button
                      variant={isExpanded ? 'secondary' : 'outline'}
                      onClick={() => toggleCategory(categoryObj.category)}
                      className={`w-full justify-between h-11 px-3 border border-neutral-800 font-sans transition-all text-left text-sm ${
                        isExpanded 
                          ? 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/15 border-blue-500/50 font-semibold' 
                          : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <span>{categoryObj.category}</span>
                      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </Button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pl-3 py-1.5 flex flex-col gap-1 border-l border-neutral-800 ml-3">
                            {categoryObj.questions.map((q, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                onClick={() => {
                                  onSelectQuestion(q);
                                  onClose();
                                }}
                                className="w-full justify-start text-left text-[13px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 h-8 px-2 font-normal rounded-md"
                              >
                                {q.title || q}
                              </Button>
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
