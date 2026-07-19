import React, { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import Visualizer from './components/Visualizer';
import QuestionBank from './components/QuestionBank';

import CommandPalette from './components/CommandPalette';
import FindReplace from './components/FindReplace';
import TerminalEmulator from './components/TerminalEmulator';
import StatusBar from './components/StatusBar';
import { generateExecutionTrace } from './services/aiService';
import { pluginManager } from './services/pluginManager';
import { Key, BookOpen, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

const getInitialKey = () => {
  try { return localStorage.getItem('codemaster_api_key') || ''; }
  catch { return ''; }
};

function App() {
  const [apiKey, setApiKey] = useState(getInitialKey());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(!getInitialKey());
  const [tempKey, setTempKey] = useState(getInitialKey());

  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [editorInitialCode, setEditorInitialCode] = useState(null);
  const [editorCode, setEditorCode] = useState('');
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // IDE UX feature states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [diagnostics, setDiagnostics] = useState([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const [aiData, setAiData] = useState(null);

  // Register sandboxed plugins (lazy — Worker only spawns if browser supports it)
  useEffect(() => {
    pluginManager.registerPlugin('theme-logger-plugin', `
      registerListener("onThemeChange", function(data) {
        console.log("Plugin: Theme changed to " + data.theme);
      });
    `);
    pluginManager.registerPlugin('diagnostics-sync-plugin', `
      registerListener("onDiagnostics", function(data) {
        if (data.diagnostics && data.diagnostics.length > 0) {
          console.warn("Plugin: " + data.diagnostics.length + " lint issues found.");
        }
      });
    `);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setIsCommandPaletteOpen(v => !v);
        }
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          setIsFindOpen(v => !v);
        }
        if (e.key === '\\') {
          e.preventDefault();
          setIsSplitView(v => !v);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const saveKey = () => {
    setApiKey(tempKey);
    try { localStorage.setItem('codemaster_api_key', tempKey); } catch (e) {}
    setIsKeyModalOpen(false);
  };

  const handleSelectQuestion = (qData) => {
    const q = typeof qData === 'string' ? { title: qData } : qData;
    setActiveQuestion(q);
    setStep(0);
    setIsPlaying(false);
    setAiData(null);

    if (q.code) {
      setEditorInitialCode(q.code);
      return;
    }

    const title = q.title || 'solution';
    const baseName = title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 3)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    const funcName = baseName.charAt(0).toLowerCase() + baseName.slice(1);
    const template = `// Q: ${title}\n// Write your algorithm below and hit Play to visualize!\n\nfunction ${funcName}() {\n  \n}\n`;
    setEditorInitialCode(template);
  };

  const handlePlay = async (codeToRun, customInput = null) => {
    if (!apiKey) { setIsKeyModalOpen(true); return; }
    setIsAnalyzing(true);
    setIsPlaying(false);
    setErrorMessage(null);
    try {
      const data = await generateExecutionTrace(apiKey, codeToRun, customInput);
      setAiData(data);
      setStep(0);
      setIsPlaying(true);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isPython = editorCode.includes('def ') || editorCode.includes('print(');
  const leftWidth = isSplitView ? '1fr' : '400px';

  return (
    <>
      {/* Modals (portals, no layout effect) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectQuestion={handleSelectQuestion}
      />
      <QuestionBank
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        onSelectQuestion={handleSelectQuestion}
      />
      {isKeyModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '32px', width: '400px' }}>
            <h2 style={{ marginBottom: '16px' }}>API Key Required</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
              CodeMaster uses Google Gemini to automatically analyze and trace your code.
            </p>
            <input
              type="password"
              value={tempKey}
              onChange={e => setTempKey(e.target.value)}
              placeholder="AIzaSy... or AQ...."
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', marginBottom: '16px', outline: 'none' }}
            />
            <button onClick={saveKey} style={{ width: '100%', padding: '12px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Save & Continue
            </button>
          </div>
        </div>
      )}

      {/* Main Layout — uses .app-container grid from CSS */}
      <div
        className="app-container"
        style={{ gridTemplateColumns: `${leftWidth} 1fr` }}
      >
        {/* ── Left: Code Editor ── */}
        <div className="glass-panel editor-panel" style={{ position: 'relative', overflow: 'hidden' }}>
          <CodeEditor
            step={step}
            onPlay={handlePlay}
            isAnalyzing={isAnalyzing}
            trace={aiData?.trace || []}
            initialCodeOverride={editorInitialCode}
            onCodeChange={(c) => setEditorCode(c)}
            onDiagnosticsChange={(diags) => setDiagnostics(diags)}
          />
          <FindReplace
            isOpen={isFindOpen}
            onClose={() => setIsFindOpen(false)}
            code={editorCode}
            onCodeChange={(newCode) => {
              setEditorCode(newCode);
              setEditorInitialCode(newCode);
            }}
          />
        </div>

        {/* ── Right: Visualizer Column ── */}
        <div
          className="glass-panel visualizer-panel"
          style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '20px', overflow: 'hidden' }}
        >
          {/* Control bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>⌘P palette</span>
              <span>⌘F find</span>
              <span>⌘\ split</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="icon-button" onClick={() => setIsQuestionBankOpen(true)}>
                <BookOpen size={16} />
                <span style={{ marginLeft: '6px', fontSize: '13px' }}>Catalogue</span>
              </button>
              <button className="icon-button" onClick={() => setIsKeyModalOpen(true)}>
                <Key size={16} />
                <span style={{ marginLeft: '6px', fontSize: '13px' }}>API Key</span>
              </button>
            </div>
          </div>

          {aiData ? (
            <>

              {/* ── Execution Error Banner ── */}
              {errorMessage && (
                <div style={{
                  flexShrink: 0,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: '#ef4444', fontSize: '16px', flexShrink: 0 }}>✕</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#ef4444', fontWeight: '600', fontSize: '13px', marginBottom: '2px' }}>Execution Error</div>
                    <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px', wordBreak: 'break-word' }}>
                      {errorMessage}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>
                      💡 Make sure your code is complete and self-contained (e.g. define and call the function with sample data).
                    </div>
                  </div>
                  <button
                    onClick={() => setErrorMessage(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', flexShrink: 0, padding: '0 4px' }}
                  >×</button>
                </div>
              )}

              {/* Visualizer grows */}
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', margin: '8px 0' }}>
                <Visualizer
                  step={step}
                  setStep={setStep}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  aiData={aiData}
                  insight={activeQuestion?.insight}
                />
              </div>
            </>
          ) : (
            /* ── Onboarding Placeholder State ── */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 20px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px dashed rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              margin: '8px 0',
              color: 'var(--text-secondary)',
              minHeight: 0,
              overflowY: 'auto'
            }}>
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(96, 165, 250, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  border: '1px solid rgba(96, 165, 250, 0.25)',
                  boxShadow: '0 0 16px rgba(96, 165, 250, 0.1)'
                }}
              >
                <Cpu size={24} color="var(--accent-color)" />
              </motion.div>
              <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                Ready to Visualize
              </h3>
              <p style={{ maxWidth: '320px', fontSize: '13px', lineHeight: '1.5', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Write or paste your algorithm on the left, then click the blue Play button (▶) to execute and see it animate step-by-step.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '280px', textAlign: 'left', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--accent-color)', fontSize: '14px' }}>⚡</span>
                  <span><strong>Variables:</strong> Trace locals, conditions & loops</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--accent-color)', fontSize: '14px' }}>📊</span>
                  <span><strong>Arrays:</strong> Watch pointers & value swaps</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--accent-color)', fontSize: '14px' }}>🌳</span>
                  <span><strong>Structures:</strong> Trees, Lists & Graphs</span>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Terminal */}
          <div style={{ flexShrink: 0, marginTop: '12px' }}>
            <button
              onClick={() => setIsTerminalOpen(v => !v)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-glass)',
                borderRadius: isTerminalOpen ? '8px 8px 0 0' : '8px',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px' }}>🖥️</span>
                <span>INTEGRATED TERMINAL</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>
                  {isTerminalOpen ? "Click to hide" : "Click to open"}
                </span>
                {isTerminalOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {isTerminalOpen && (
              <TerminalEmulator
                code={editorCode}
                onPlay={handlePlay}
                lspDiagnostics={diagnostics}
              />
            )}
          </div>
        </div>
      </div>

      {/* Status Bar — outside grid, at very bottom */}
      <StatusBar
        isAnalyzing={isAnalyzing}
        diagnosticsCount={diagnostics.length}
        isPython={isPython}
      />
    </>
  );
}

export default App;
