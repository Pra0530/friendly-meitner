import React, { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import Visualizer from './components/Visualizer';
import QuestionBank from './components/QuestionBank';
import InputEditor from './components/InputEditor';
import CommandPalette from './components/CommandPalette';
import FindReplace from './components/FindReplace';
import TerminalEmulator from './components/TerminalEmulator';
import StatusBar from './components/StatusBar';
import { generateExecutionTrace } from './services/aiService';
import { pluginManager } from './services/pluginManager';
import { Key, BookOpen, Search, Command } from 'lucide-react';

const getInitialKey = () => {
  try { return localStorage.getItem('codemaster_api_key') || ''; }
  catch { return ''; }
};

function App() {
  const [apiKey, setApiKey] = useState(getInitialKey());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(!apiKey);
  const [tempKey, setTempKey] = useState(apiKey);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [editorInitialCode, setEditorInitialCode] = useState(null);
  const [editorCode, setEditorCode] = useState('');
  const [activeQuestion, setActiveQuestion] = useState(null);
  
  // UX Shortcut states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [diagnostics, setDiagnostics] = useState([]);

  // Default dummy state before AI kicks in
  const [aiData, setAiData] = useState({
    layout_type: "LINKED_LIST",
    initial_data: [10, 20, 30, 40, 50],
    trace: [
      { line: 0, pointers: { slow: 0, fast: 0 }, variables: {} }
    ]
  });

  // Load sandboxed plugins on mount
  useEffect(() => {
    pluginManager.registerPlugin("theme-logger-plugin", `
      registerListener("onThemeChange", function(data) {
        console.log("Plugin Sandbox: Theme updated to " + data.theme);
      });
    `);

    pluginManager.registerPlugin("diagnostics-sync-plugin", `
      registerListener("onDiagnostics", function(data) {
        if (data.diagnostics.length > 0) {
          console.error("Plugin Sandbox Detected Errors: " + data.diagnostics.length);
        }
      });
    `);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Cmd/Ctrl + P (Command Palette)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Cmd/Ctrl + F (Find Panel)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindOpen(prev => !prev);
      }
      // Cmd/Ctrl + \ (Split View Layout)
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setIsSplitView(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
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
    setAiData({
      layout_type: "ARRAY",
      initial_data: [],
      trace: []
    });
    
    if (q.code) {
      setEditorInitialCode(q.code);
      return;
    }

    const title = q.title;
    const baseName = title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    const funcName = baseName.charAt(0).toLowerCase() + baseName.slice(1);
    
    const defaultLink = "https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/";
    const template = `// Q: ${title}\n// Article Link: ${defaultLink}\n// Video Link: https://www.youtube.com/@takeUforward/search?query=${encodeURIComponent(title)}\n// Write your algorithm below and hit Play to visualize!\n\nfunction ${funcName}() {\n  \n}\n`;
    setEditorInitialCode(template);
  };

  const handlePlay = async (codeToRun, customInput = null) => {
    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }
    
    setIsAnalyzing(true);
    setIsPlaying(false);
    try {
      const data = await generateExecutionTrace(apiKey, codeToRun, customInput);
      setAiData(data);
      setStep(0);
      setIsPlaying(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isPython = editorCode.includes('def ') || editorCode.includes('import ') || editorCode.includes('print(');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* Command Palette Modal */}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyCenter: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div className="glass-panel" style={{ padding: '32px', width: '400px' }}>
              <h2 style={{ marginBottom: '16px' }}>API Key Required</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                CodeMaster uses Google Gemini to automatically analyze and trace your pasted code. Please provide a Gemini API Key.
              </p>
              <input 
                type="password"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                placeholder="AIzaSy..."
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', marginBottom: '16px', outline: 'none' }}
              />
              <button onClick={saveKey} style={{ width: '100%', padding: '12px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Save & Continue
              </button>
           </div>
        </div>
      )}

      {/* Main Grid View */}
      <div 
        className="app-container" 
        style={{ 
          flex: 1, 
          gridTemplateColumns: isSplitView ? '1fr 1fr' : '400px 1fr',
          paddingBottom: '8px',
          overflow: 'hidden'
        }}
      >
        {/* Editor Gutter Column */}
        <div className="glass-panel editor-panel" style={{ position: 'relative' }}>
          <CodeEditor 
            step={step} 
            onPlay={handlePlay} 
            isAnalyzing={isAnalyzing} 
            trace={aiData?.trace || []} 
            initialCodeOverride={editorInitialCode}
            onCodeChange={(c) => setEditorCode(c)}
            onDiagnosticsChange={(diags) => setDiagnostics(diags)}
          />

          {/* Find & Replace overlay panel */}
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

        {/* Visualizer & Console Column */}
        <div className="glass-panel visualizer-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', overflow: 'hidden' }}>
          
          {/* Top Control Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            {/* Quick shortcuts tips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Command size={10} />P palette</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Command size={10} />F find</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Command size={10} />\ split</span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="icon-button" onClick={() => setIsQuestionBankOpen(true)} title="DSA 100 Question Bank">
                 <BookOpen size={16} /> <span style={{ marginLeft: '6px', fontSize: '13px', fontWeight: '500' }}>Catalogue</span>
              </button>
              <button className="icon-button" onClick={() => setIsKeyModalOpen(true)} title="Settings">
                 <Key size={16} /> <span style={{ marginLeft: '6px', fontSize: '13px', fontWeight: '500' }}>API Key</span>
              </button>
            </div>
          </div>

          <InputEditor 
            onRun={(customInput) => handlePlay(editorCode, customInput)} 
            isAnalyzing={isAnalyzing} 
            initialData={aiData?.initial_data} 
          />

          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <Visualizer 
              step={step} 
              setStep={setStep} 
              isPlaying={isPlaying} 
              setIsPlaying={setIsPlaying} 
              aiData={aiData} 
              insight={activeQuestion?.insight}
            />
          </div>

          {/* Interactive Console Terminal */}
          <TerminalEmulator 
            code={editorCode}
            onPlay={handlePlay}
            lspDiagnostics={diagnostics}
          />
        </div>
      </div>

      {/* System Status Bar */}
      <StatusBar 
        isAnalyzing={isAnalyzing}
        diagnosticsCount={diagnostics.length}
        isPython={isPython}
      />
    </div>
  );
}

export default App;
