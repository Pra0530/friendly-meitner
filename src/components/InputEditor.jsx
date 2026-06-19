import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

const InputEditor = ({ onRun, isAnalyzing, initialData }) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setInputValue(initialData.join(', '));
    }
  }, [initialData]);

  const handleRun = () => {
    if (!inputValue.trim()) return;
    onRun(inputValue);
  };

  const setPreset = (preset) => {
    let val = "";
    switch (preset) {
      case 'descending': val = "9, 8, 7, 6, 5"; break;
      case 'ascending': val = "1, 2, 3, 4, 5"; break;
      case 'single': val = "42"; break;
      case 'empty': val = ""; break;
      default: break;
    }
    setInputValue(val);
    // Don't auto run, let user see it first
  };

  return (
    <div style={{ marginBottom: '16px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g. 7, 1, 5, 3, 6, 4"
          style={{ 
            flex: 1, 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-glass)', 
            color: 'var(--text-primary)', 
            padding: '8px 12px', 
            borderRadius: '6px',
            fontFamily: 'var(--font-mono)',
            outline: 'none'
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleRun()}
        />
        <button 
          className="icon-button primary" 
          onClick={handleRun}
          disabled={isAnalyzing}
          style={{ padding: '8px 16px', borderRadius: '6px', opacity: isAnalyzing ? 0.7 : 1 }}
        >
          {isAnalyzing ? "..." : <><Play size={16} /> Run</>}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="preset-btn" onClick={() => setPreset('descending')}>Descending</button>
        <button className="preset-btn" onClick={() => setPreset('ascending')}>Ascending</button>
        <button className="preset-btn" onClick={() => setPreset('single')}>Single element</button>
        <button className="preset-btn" onClick={() => setPreset('empty')}>Empty array</button>
      </div>
      <style>{`
        .preset-btn {
          background: transparent;
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          padding: 4px 8px;
          font-size: 11px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .preset-btn:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export default InputEditor;
