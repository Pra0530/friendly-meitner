import React, { useState } from 'react';
import CodeEditor from './components/CodeEditor';
import Visualizer from './components/Visualizer';
import QuestionBank from './components/QuestionBank';
import InputEditor from './components/InputEditor';
import { generateExecutionTrace } from './services/aiService';
import { Key, BookOpen } from 'lucide-react';

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
  
  // Default dummy state before AI kicks in
  const [aiData, setAiData] = useState({
    layout_type: "LINKED_LIST",
    initial_data: [10, 20, 30, 40, 50],
    trace: [
      { line: 0, pointers: { slow: 0, fast: 0 }, variables: {} }
    ]
  });

  const saveKey = () => {
    setApiKey(tempKey);
    try { localStorage.setItem('codemaster_api_key', tempKey); } catch (e) {}
    setIsKeyModalOpen(false);
  };

  const handleSelectQuestion = (qData) => {
    // If it's the old string format, convert it to an object temporarily
    const q = typeof qData === 'string' ? { title: qData } : qData;
    setActiveQuestion(q);
    
    // If we have a pre-written perfect code block, drop it in!
    if (q.code) {
      setEditorInitialCode(q.code);
      return;
    }

    // Otherwise generate the standard empty template with a default link
    const title = q.title;
    const baseName = title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    const funcName = baseName.charAt(0).toLowerCase() + baseName.slice(1);
    
    const defaultLink = "https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/";
    const template = `// Q: ${title}\n// Article Link: ${defaultLink}\n// Video Link: https://www.youtube.com/@takeUforward/search?query=${encodeURIComponent(title)}\n// Write your algorithm below and hit Play to visualize!\n\nfunction ${funcName}() {\n  \n}\n`;
    setEditorInitialCode(template);
  };

  const handlePlay = async (code, customInput = null) => {
    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }
    
    setIsAnalyzing(true);
    setIsPlaying(false);
    try {
      const data = await generateExecutionTrace(apiKey, code, customInput);
      setAiData(data);
      setStep(0);
      setIsPlaying(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-container">
      {/* Removed absolute buttons from here */}

      <QuestionBank 
        isOpen={isQuestionBankOpen} 
        onClose={() => setIsQuestionBankOpen(false)} 
        onSelectQuestion={handleSelectQuestion} 
      />

      {isKeyModalOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      <div className="glass-panel editor-panel">
        <CodeEditor 
          step={step} 
          onPlay={handlePlay} 
          isAnalyzing={isAnalyzing} 
          trace={aiData?.trace || []} 
          initialCodeOverride={editorInitialCode}
          onCodeChange={(c) => setEditorCode(c)}
        />
      </div>
      <div className="glass-panel visualizer-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
          <button className="icon-button" onClick={() => setIsQuestionBankOpen(true)} title="DSA 100 Question Bank">
             <BookOpen size={16} /> <span style={{ marginLeft: '6px', fontSize: '13px', fontWeight: '500' }}>Catalogue</span>
          </button>
          <button className="icon-button" onClick={() => setIsKeyModalOpen(true)} title="Settings">
             <Key size={16} /> <span style={{ marginLeft: '6px', fontSize: '13px', fontWeight: '500' }}>API Key</span>
          </button>
        </div>
        <InputEditor 
          onRun={(customInput) => handlePlay(editorCode, customInput)} 
          isAnalyzing={isAnalyzing} 
          initialData={aiData?.initial_data} 
        />
        <Visualizer 
          step={step} 
          setStep={setStep} 
          isPlaying={isPlaying} 
          setIsPlaying={setIsPlaying} 
          aiData={aiData} 
          insight={activeQuestion?.insight}
        />
      </div>
    </div>
  );
}

export default App;
