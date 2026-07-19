import React, { useState, useRef, useEffect } from 'react';
import { Code2, Play, Loader2, AlertCircle } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import { pluginManager } from '../services/pluginManager';
import 'prismjs/themes/prism-twilight.css';

const CodeEditor = ({ 
  step, 
  onPlay, 
  isAnalyzing, 
  trace = [], 
  initialCodeOverride, 
  onCodeChange,
  onDiagnosticsChange 
}) => {
  const [code, setCode] = useState(
    '// Hey AI, please trace this with a target value of 7\nfunction searchBST(root, target) {\n  let curr = root;\n  \n  while (curr !== null) {\n    if (curr.val === target) {\n      return curr;\n    }\n    \n    // If target is smaller, go left\n    if (target < curr.val) {\n      curr = curr.left;\n    } \n    // If target is larger, go right\n    else {\n      curr = curr.right;\n    }\n  }\n  \n  return null;\n}'
  );

  const [diagnostics, setDiagnostics] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(500);

  const bgRef = useRef(null);
  const containerRef = useRef(null);
  const lspWorkerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Initialize Language Server Web Worker (LSP Decoupled Intelligence)
  useEffect(() => {
    try {
      lspWorkerRef.current = new Worker('/languageWorker.js');
      lspWorkerRef.current.postMessage({ method: 'initialize' });

      lspWorkerRef.current.onmessage = (e) => {
        const { method, params } = e.data;
        if (method === 'textDocument/publishDiagnostics') {
          const { diagnostics: newDiagnostics, symbols } = params;
          setDiagnostics(newDiagnostics);
          if (onDiagnosticsChange) {
            onDiagnosticsChange(newDiagnostics, symbols);
          }
          // Notify plugins about compilation/AST event
          pluginManager.triggerEvent('onDiagnostics', { diagnostics: newDiagnostics, symbols });
        }
      };
    } catch (err) {
      console.error('Failed to spawn LSP Web Worker:', err);
    }

    return () => {
      if (lspWorkerRef.current) {
        lspWorkerRef.current.terminate();
      }
    };
  }, []);

  // Sync initial code override
  useEffect(() => {
    if (initialCodeOverride) {
      setCode(initialCodeOverride);
      if (onCodeChange) onCodeChange(initialCodeOverride);
      triggerDiagnostics(initialCodeOverride);
    }
  }, [initialCodeOverride]);

  // Debounced Syntax Checking via LSP Worker
  const triggerDiagnostics = (newCode) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      if (lspWorkerRef.current) {
        const isPython = newCode.includes('def ') || newCode.includes('import ') || newCode.includes('print(');
        lspWorkerRef.current.postMessage({
          method: 'textDocument/didChange',
          params: {
            text: newCode,
            language: isPython ? 'python' : 'javascript'
          }
        });
      }
    }, 150);
  };

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
    setClientHeight(e.target.clientHeight);
    if (bgRef.current) {
      bgRef.current.scrollTop = e.target.scrollTop;
      bgRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  // Adjust height measurement on mount/resize
  useEffect(() => {
    if (containerRef.current) {
      setClientHeight(containerRef.current.clientHeight);
    }
  }, []);

  const safeTrace = trace || [];
  const activeLine = (safeTrace && safeTrace[step]) ? safeTrace[step].line : -1;
  const lines = code.split('\n');

  useEffect(() => {
    // Dynamically load Prism languages to avoid Vite production hoisting crashes
    window.Prism = Prism;
    import('prismjs/components/prism-javascript');
    import('prismjs/components/prism-python');
  }, []);

  const handleKeyDown = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    // 1. Bracket & Quote Auto-closing
    const pairs = {
      '{': '}',
      '[': ']',
      '(': ')',
      '"': '"',
      "'": "'",
      '`': '`'
    };

    if (pairs[e.key] !== undefined) {
      e.preventDefault();
      const closingChar = pairs[e.key];
      const newCode = val.substring(0, start) + e.key + closingChar + val.substring(end);
      setCode(newCode);
      if (onCodeChange) onCodeChange(newCode);
      triggerDiagnostics(newCode);
      
      // Reposition cursor inside brackets/quotes
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
      return;
    }

    // 2. Overwriting auto-closed brackets/quotes
    const closingChars = new Set(['}', ']', ')', '"', "'", '`']);
    if (closingChars.has(e.key) && val[start] === e.key) {
      e.preventDefault();
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
      return;
    }

    // 3. Backspacing an auto-closed bracket pair
    if (e.key === 'Backspace' && start === end) {
      const charBefore = val[start - 1];
      const charAfter = val[start];
      if (pairs[charBefore] === charAfter) {
        e.preventDefault();
        const newCode = val.substring(0, start - 1) + val.substring(start + 1);
        setCode(newCode);
        if (onCodeChange) onCodeChange(newCode);
        triggerDiagnostics(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 1;
        }, 0);
        return;
      }
    }

    // 4. Auto-indentation on Enter
    if (e.key === 'Enter' && start === end) {
      const linesBefore = val.substring(0, start).split('\n');
      const currentLine = linesBefore[linesBefore.length - 1];
      const indentMatch = currentLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';

      const trimmedLine = currentLine.trim();
      const extraIndent = (trimmedLine.endsWith('{') || trimmedLine.endsWith(':') || trimmedLine.endsWith('[')) ? '  ' : '';

      e.preventDefault();
      const newCode = val.substring(0, start) + '\n' + indent + extraIndent + val.substring(start);
      setCode(newCode);
      if (onCodeChange) onCodeChange(newCode);
      triggerDiagnostics(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length + extraIndent.length;
      }, 0);
      return;
    }
  };

  const EditorComponent = Editor.default || Editor;

  // Viewport Virtualization Calculations
  const startIdx = Math.max(0, Math.floor(scrollTop / 21) - 10);
  const endIdx = Math.min(lines.length, Math.ceil((scrollTop + clientHeight) / 21) + 10);

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
      
      <div 
        ref={containerRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-glass)', background: '#141414' }}
      >
        {/* Background Highlight Layer (Virtualized) */}
        <div 
          ref={bgRef}
          style={{ 
            position: 'absolute', 
            top: 0,
            bottom: 0,
            left: '36px',
            right: 0,
            paddingTop: '16px', 
            paddingBottom: '16px', 
            paddingLeft: '12px',
            overflow: 'hidden', 
            pointerEvents: 'none', 
            zIndex: 1 
          }}
        >
          <div style={{ position: 'relative', height: `${lines.length * 21}px`, width: '100%' }}>
            {lines.slice(startIdx, endIdx).map((_, i) => {
              const idx = startIdx + i;
              if ((activeLine - 1) !== idx) return null;
              return (
                <div 
                  key={idx}
                  style={{ 
                    position: 'absolute',
                    top: `${idx * 21}px`,
                    left: 0,
                    height: '21px',
                    width: '1000%',
                    marginLeft: '-12px',
                    paddingLeft: '12px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    borderLeft: '3px solid var(--accent-color)',
                    transition: 'all 0.2s ease'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Real Syntax Highlighted Editor */}
        <div 
          style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'auto', display: 'flex' }} 
          onScroll={handleScroll}
        >
          {/* Gutter / Line Numbers (Virtualized) */}
          <div style={{
            position: 'sticky',
            left: 0,
            width: '36px',
            background: '#141414',
            borderRight: '1px solid var(--border-glass)',
            paddingTop: '16px',
            paddingBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            paddingRight: '8px',
            userSelect: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: '21px',
            zIndex: 4,
            height: `${lines.length * 21 + 32}px`,
            color: '#4a5568'
          }}>
            <div style={{ position: 'relative', height: `${lines.length * 21}px`, width: '100%' }}>
              {lines.slice(startIdx, endIdx).map((_, i) => {
                const idx = startIdx + i;
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      position: 'absolute',
                      top: `${idx * 21}px`,
                      right: 0,
                      left: 0,
                      height: '21px',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      color: (activeLine - 1) === idx ? 'var(--accent-color)' : '#4a5568',
                      fontWeight: (activeLine - 1) === idx ? 'bold' : 'normal'
                    }}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <EditorComponent
              value={code}
              onValueChange={newCode => {
                setCode(newCode);
                if (onCodeChange) onCodeChange(newCode);
                triggerDiagnostics(newCode);
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
              onKeyDown={handleKeyDown}
              padding={0}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                lineHeight: '21px',
                minHeight: '100%',
                outline: 'none',
                paddingTop: '16px',
                paddingBottom: '16px',
                paddingLeft: '12px',
                paddingRight: '16px'
              }}
            />
          </div>
        </div>
      </div>

      {/* LSP Inline Diagnostics Panel */}
      {diagnostics.length > 0 && (
        <div style={{
          marginTop: '12px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          maxHeight: '100px',
          overflowY: 'auto'
        }}>
          {diagnostics.map((diag, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-color)', fontSize: '13px' }}>
              <AlertCircle size={14} />
              <span><strong>Line {diag.line}:</strong> {diag.message}</span>
            </div>
          ))}
        </div>
      )}
      
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
