import React, { useState, useRef, useEffect } from 'react';
import { Code2, Play, Loader2 } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/themes/prism-twilight.css';

const CodeEditor = ({ step, onPlay, isAnalyzing, trace = [], initialCodeOverride, onCodeChange }) => {
  const [code, setCode] = useState(
    '// Hey AI, please trace this with a target value of 7\nfunction searchBST(root, target) {\n  let curr = root;\n  \n  while (curr !== null) {\n    if (curr.val === target) {\n      return curr;\n    }\n    \n    // If target is smaller, go left\n    if (target < curr.val) {\n      curr = curr.left;\n    } \n    // If target is larger, go right\n    else {\n      curr = curr.right;\n    }\n  }\n  \n  return null;\n}'
  );
  
  useEffect(() => {
    if (initialCodeOverride) {
      setCode(initialCodeOverride);
      if (onCodeChange) onCodeChange(initialCodeOverride);
    }
  }, [initialCodeOverride]);
  
  const bgRef = useRef(null);

  const handleScroll = (e) => {
    if (bgRef.current) {
      bgRef.current.scrollTop = e.target.scrollTop;
      bgRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const safeTrace = trace || [];
  const activeLine = (safeTrace && safeTrace[step]) ? safeTrace[step].line : -1;
  const lines = code.split('\n');

  useEffect(() => {
    // Dynamically load Prism languages to avoid Vite production hoisting crashes
    window.Prism = Prism;
    import('prismjs/components/prism-javascript');
    import('prismjs/components/prism-python');
  }, []);

  const EditorComponent = Editor.default || Editor;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      <div className="controls-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Code2 size={20} color="var(--accent-color)" />
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Source Code</h2>
        </div>
        <button 
          className="icon-button primary" 
          title="Analyze & Play" 
          onClick={() => onPlay(code)}
          disabled={isAnalyzing}
          style={{ opacity: isAnalyzing ? 0.7 : 1 }}
        >
          {isAnalyzing ? <Loader2 size={18} className="spin" /> : <Play size={18} />}
        </button>
      </div>
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-glass)', background: '#141414' }}>
        
        {/* Background Highlight Layer */}
        <div 
          ref={bgRef}
          style={{ 
            position: 'absolute', 
            inset: 0, 
            padding: '16px', 
            overflow: 'hidden', 
            pointerEvents: 'none', 
            zIndex: 1 
          }}
        >
          {lines.map((_, index) => (
            <div 
              key={index}
              style={{ 
                height: '21px', // Enforced line height
                width: '1000%',
                marginLeft: '-16px',
                paddingLeft: '16px',
                background: (activeLine - 1) === index ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                borderLeft: (activeLine - 1) === index ? '3px solid var(--accent-color)' : '3px solid transparent',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>

        {/* Real Syntax Highlighted Editor */}
        <div 
          style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'auto' }} 
          onScroll={handleScroll}
        >
          <EditorComponent
            value={code}
            onValueChange={newCode => {
              setCode(newCode);
              if (onCodeChange) onCodeChange(newCode);
            }}
            highlight={code => {
              const grammar = Prism.languages.javascript || Prism.languages.js;
              if (grammar) {
                try {
                  return Prism.highlight(code, grammar, 'javascript');
                } catch (e) {
                  return code;
                }
              }
              return code;
            }}
            padding={16}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              lineHeight: '21px',
              minHeight: '100%',
              outline: 'none'
            }}
          />
        </div>
      </div>
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        /* Override prism JS default backgrounds */
        pre[class*="language-"] { background: transparent !important; margin: 0 !important; padding: 0 !important; }
        code[class*="language-"], pre[class*="language-"] { text-shadow: none !important; color: #e2e8f0 !important; }
      `}</style>
    </div>
  );
};

export default CodeEditor;
