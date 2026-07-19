import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Code2, Play, Loader2, AlertCircle } from 'lucide-react';

const LINE_HEIGHT = 20; // px per line

const CodeEditor = ({ 
  step, 
  onPlay, 
  isAnalyzing, 
  trace = [], 
  initialCodeOverride, 
  onCodeChange,
  onDiagnosticsChange 
}) => {
  const DEFAULT_CODE = `// Hey AI, please trace this with a target value of 7
function searchBST(root, target) {
  let curr = root;
  
  while (curr !== null) {
    if (curr.val === target) {
      return curr;
    }
    
    // If target is smaller, go left
    if (target < curr.val) {
      curr = curr.left;
    } 
    // If target is larger, go right
    else {
      curr = curr.right;
    }
  }
  
  return null;
}`;

  const [code, setCode] = useState(DEFAULT_CODE);
  const [diagnostics, setDiagnostics] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const lspWorkerRef = useRef(null);
  const debounceRef = useRef(null);

  // ---------- LSP Worker (decoupled, non-blocking) ----------
  useEffect(() => {
    try {
      if (typeof Worker !== 'undefined') {
        lspWorkerRef.current = new Worker('/languageWorker.js');
        lspWorkerRef.current.postMessage({ method: 'initialize' });

        lspWorkerRef.current.onmessage = (e) => {
          const { method, params } = e.data;
          if (method === 'textDocument/publishDiagnostics') {
            const { diagnostics: diags, symbols } = params;
            setDiagnostics(diags || []);
            if (onDiagnosticsChange) onDiagnosticsChange(diags || [], symbols || []);
          }
        };

        lspWorkerRef.current.onerror = (err) => {
          console.warn('LSP Worker error (non-fatal):', err.message);
        };
      }
    } catch (err) {
      console.warn('LSP Worker could not start (non-fatal):', err.message);
    }

    return () => {
      if (lspWorkerRef.current) {
        try { lspWorkerRef.current.terminate(); } catch (e) {}
      }
    };
  }, []);

  // Debounced send to LSP Worker
  const triggerDiagnostics = useCallback((text) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (lspWorkerRef.current) {
        const isPython = /\bdef\b|\bimport\b|\bprint\s*\(/.test(text);
        lspWorkerRef.current.postMessage({
          method: 'textDocument/didChange',
          params: { text, language: isPython ? 'python' : 'javascript' }
        });
      }
    }, 200);
  }, []);

  // Sync initial code override
  useEffect(() => {
    if (initialCodeOverride) {
      setCode(initialCodeOverride);
      if (onCodeChange) onCodeChange(initialCodeOverride);
      triggerDiagnostics(initialCodeOverride);
    }
  }, [initialCodeOverride]);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;
    setContainerHeight(containerRef.current.clientHeight);
    const ro = new ResizeObserver(entries => {
      setContainerHeight(entries[0]?.contentRect?.height || 500);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = (e) => {
    const st = e.target.scrollTop;
    const sl = e.target.scrollLeft;
    setScrollTop(st);
    if (highlightRef.current) {
      highlightRef.current.scrollTop = st;
      highlightRef.current.scrollLeft = sl;
    }
  };

  const safeTrace = Array.isArray(trace) ? trace : [];
  const activeLine = (safeTrace[step] ? safeTrace[step].line : -1); // 1-based
  const lines = code.split('\n');

  // Viewport virtualization: render only visible line numbers
  const visibleStart = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - 5);
  const visibleEnd = Math.min(lines.length, Math.ceil((scrollTop + containerHeight) / LINE_HEIGHT) + 5);

  // ---------- Smart key handling ----------
  const handleKeyDown = (e) => {
    const ta = e.target;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    const pairs = { '{': '}', '[': ']', '(': ')', '"': '"', "'": "'", '`': '`' };
    const closingSet = new Set(['}', ']', ')', '"', "'", '`']);

    // Auto-close brackets
    if (pairs[e.key] !== undefined) {
      e.preventDefault();
      const closing = pairs[e.key];
      const newCode = val.slice(0, start) + e.key + closing + val.slice(end);
      updateCode(newCode, ta, start + 1);
      return;
    }

    // Skip over auto-closed character
    if (closingSet.has(e.key) && val[start] === e.key && start === end) {
      e.preventDefault();
      ta.selectionStart = ta.selectionEnd = start + 1;
      return;
    }

    // Delete bracket pair
    if (e.key === 'Backspace' && start === end && start > 0) {
      const before = val[start - 1];
      const after = val[start];
      if (pairs[before] === after) {
        e.preventDefault();
        const newCode = val.slice(0, start - 1) + val.slice(start + 1);
        updateCode(newCode, ta, start - 1);
        return;
      }
    }

    // Smart Enter indent
    if (e.key === 'Enter' && start === end) {
      const linesBefore = val.slice(0, start).split('\n');
      const currentLine = linesBefore[linesBefore.length - 1];
      const baseIndent = currentLine.match(/^(\s*)/)[1];
      const trimmed = currentLine.trimEnd();
      const extraIndent = (trimmed.endsWith('{') || trimmed.endsWith(':') || trimmed.endsWith('[')) ? '  ' : '';
      e.preventDefault();
      const insertion = '\n' + baseIndent + extraIndent;
      const newCode = val.slice(0, start) + insertion + val.slice(end);
      updateCode(newCode, ta, start + insertion.length);
      return;
    }
  };

  const updateCode = (newCode, ta, cursorPos) => {
    setCode(newCode);
    if (onCodeChange) onCodeChange(newCode);
    triggerDiagnostics(newCode);
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      if (ta) {
        ta.selectionStart = cursorPos;
        ta.selectionEnd = cursorPos;
      }
    });
  };

  // Syntax colorise (CSS-only approach via keyword spans)
  const colorise = (rawCode) => {
    const escaped = rawCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped
      // Strings
      .replace(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g, '<span style="color:#a3e635">$1$2$1</span>')
      // Single-line comments
      .replace(/(\/\/[^\n]*)/g, '<span style="color:#64748b;font-style:italic">$1</span>')
      // Multi-line comments
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#64748b;font-style:italic">$1</span>')
      // Keywords
      .replace(/\b(function|return|const|let|var|if|else|while|for|of|in|class|new|this|typeof|null|undefined|true|false|import|export|default|async|await|break|continue|switch|case|try|catch|throw|def|pass|print|not|and|or|elif|yield)\b/g, '<span style="color:#818cf8">$1</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#fb923c">$1</span>');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      {/* Header */}
      <div className="controls-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Code2 size={20} color="var(--accent-color)" />
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Source Code</h2>
        </div>
        <button 
          className="icon-button primary"
          onClick={() => onPlay(code)}
          disabled={isAnalyzing}
          style={{ opacity: isAnalyzing ? 0.7 : 1 }}
        >
          {isAnalyzing ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={18} />}
        </button>
      </div>

      {/* Editor Body */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          border: '1px solid var(--border-glass)',
          background: '#0d0d0f',
          display: 'flex'
        }}
      >
        {/* Line Number Gutter — Virtualized */}
        <div style={{
          width: '44px',
          flexShrink: 0,
          background: '#0d0d0f',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
          position: 'relative',
          userSelect: 'none'
        }}>
          {/* Spacer so gutter scrolls with textarea */}
          <div style={{ height: `${lines.length * LINE_HEIGHT + 32}px`, position: 'relative' }}>
            {lines.slice(visibleStart, visibleEnd).map((_, i) => {
              const lineIdx = visibleStart + i;
              const isActive = lineIdx === activeLine - 1;
              return (
                <div
                  key={lineIdx}
                  style={{
                    position: 'absolute',
                    top: `${lineIdx * LINE_HEIGHT + 16}px`,
                    left: 0,
                    right: 0,
                    height: `${LINE_HEIGHT}px`,
                    lineHeight: `${LINE_HEIGHT}px`,
                    textAlign: 'right',
                    paddingRight: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: isActive ? 'var(--accent-color)' : '#3f3f52',
                    fontWeight: isActive ? 'bold' : 'normal',
                    transition: 'color 0.15s ease'
                  }}
                >
                  {lineIdx + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* Syntax Highlight Overlay (read-only, non-interactive) */}
          <div
            ref={highlightRef}
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              padding: '16px 16px 16px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              lineHeight: `${LINE_HEIGHT}px`,
              whiteSpace: 'pre',
              overflowX: 'auto',
              overflowY: 'hidden',
              pointerEvents: 'none',
              zIndex: 1,
              color: '#e2e8f0',
              wordBreak: 'keep-all'
            }}
            dangerouslySetInnerHTML={{ __html: colorise(code) }}
          />

          {/* Active Line Highlight */}
          {activeLine > 0 && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: `${(activeLine - 1) * LINE_HEIGHT + 16}px`,
                left: 0,
                right: 0,
                height: `${LINE_HEIGHT}px`,
                background: 'rgba(56, 189, 248, 0.12)',
                borderLeft: '3px solid var(--accent-color)',
                pointerEvents: 'none',
                zIndex: 2,
                transition: 'top 0.15s ease'
              }}
            />
          )}

          {/* The actual textarea (transparent text, on top of highlight) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              const newCode = e.target.value;
              setCode(newCode);
              if (onCodeChange) onCodeChange(newCode);
              triggerDiagnostics(newCode);
            }}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            style={{
              position: 'absolute',
              inset: 0,
              padding: '16px 16px 16px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              lineHeight: `${LINE_HEIGHT}px`,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'transparent',
              caretColor: '#60a5fa',
              zIndex: 3,
              width: '100%',
              height: '100%',
              overflowX: 'auto',
              overflowY: 'auto',
              whiteSpace: 'pre',
              wordBreak: 'keep-all',
              tabSize: 2
            }}
          />
        </div>
      </div>

      {/* Diagnostics Panel (LSP errors) */}
      {diagnostics.length > 0 && (
        <div style={{
          marginTop: '10px',
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.18)',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          maxHeight: '80px',
          overflowY: 'auto'
        }}>
          {diagnostics.slice(0, 5).map((diag, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-color)', fontSize: '12px' }}>
              <AlertCircle size={12} />
              <span><strong>Line {diag.line}:</strong> {diag.message}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CodeEditor;
