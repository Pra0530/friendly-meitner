import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Zap, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import ArrayLayout from './layouts/ArrayLayout';
import TreeLayout from './layouts/TreeLayout';
import MatrixLayout from './layouts/MatrixLayout';
import StackLayout from './layouts/StackLayout';
import GraphLayout from './layouts/GraphLayout';
import SystemLayout from './layouts/SystemLayout';
import VariablesLayout from './layouts/VariablesLayout';
import TraceLog from './TraceLog';
import PlaybackControls from './PlaybackControls';
import VariablePanel from './VariablePanel';
import InsightPanel from './InsightPanel';

const Visualizer = ({ step, setStep, isPlaying, setIsPlaying, aiData, insight }) => {
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1);
  const [isVoiceEnabled, setIsVoiceEnabled] = React.useState(false);
  const layout_type = (aiData?.layout_type || 'ARRAY').toLowerCase();
  const initial_data = aiData?.initial_data || [];
  const root_id = aiData?.root_id;
  const trace = aiData?.trace || [];
  const MAX_STEP = Math.max(0, trace.length - 1);

  const currentState = trace[step] || trace[0] || {};
  const pointers = currentState?.pointers || [];
  const variables = { ...currentState?.variables };
  
  // If a pointer doesn't exist in the data (like when it becomes null or -1)
  // we should display it in the variables section so the user knows it's null
  if (Array.isArray(pointers)) {
    pointers.forEach(({ name, target }) => {
      if (target === "-1" || target === "null" || target === null || target === undefined) {
        variables[name] = "null";
      }
    });
  } else {
    Object.entries(pointers).forEach(([pName, pVal]) => {
      if (pVal === -1 || pVal === null || pVal === "null") {
        variables[pName] = "null";
      }
    });
  }

  const explanation = currentState?.explanation || "";

  useEffect(() => {
    if (isVoiceEnabled && explanation) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(explanation);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [step, explanation, isVoiceEnabled]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      <div className="controls-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Zap size={20} color="var(--warning-color)" />
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }} className="text-gradient">Live Execution</h2>
        </div>
        
        {/* Voice Narration Button */}
        <button 
          onClick={() => {
            const next = !isVoiceEnabled;
            setIsVoiceEnabled(next);
            if (!next) {
              window.speechSynthesis.cancel();
            }
          }}
          style={{
            background: isVoiceEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isVoiceEnabled ? 'var(--success-color)' : 'var(--border-glass)'}`,
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isVoiceEnabled ? 'var(--success-color)' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '13px',
            fontWeight: '500'
          }}
          title={isVoiceEnabled ? "Disable Voice Narration" : "Enable Voice Narration"}
        >
          {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>{isVoiceEnabled ? "Voice On" : "Voice Off"}</span>
        </button>
      </div>
      
      <PlaybackControls 
        step={step} 
        setStep={setStep} 
        isPlaying={isPlaying} 
        setIsPlaying={setIsPlaying} 
        MAX_STEP={MAX_STEP} 
        playbackSpeed={playbackSpeed}
        setPlaybackSpeed={setPlaybackSpeed}
      />

      {/* Variables Display — hidden for VARIABLES layout (shown inside canvas instead) */}
      {layout_type !== 'variables' && (
        <VariablePanel traceHistory={trace.slice(0, step + 1)} currentVariables={variables} />
      )}

      {/* Insight Panel */}
      <InsightPanel insight={insight} />

      {/* Dynamic Layout Canvas */}
      <div
        className="canvas-area"
        style={{
          overflow: 'auto',
          display: 'flex',
          alignItems: layout_type === 'variables' ? 'flex-start' : 'center',
          justifyContent: layout_type === 'variables' ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        {layout_type === 'array' || layout_type === 'linked_list' ? (
          <ArrayLayout initial_data={initial_data} layout_type={layout_type} pointers={pointers} traceHistory={trace.slice(0, step + 1)} />
        ) : layout_type === 'tree' ? (
          <TreeLayout initial_data={initial_data} root_id={root_id} pointers={pointers} currentState={currentState} />
        ) : layout_type === 'graph' ? (
          <GraphLayout initial_data={initial_data} pointers={pointers} currentState={currentState} />
        ) : layout_type === 'matrix' ? (
          <MatrixLayout initial_data={initial_data} pointers={pointers} currentState={currentState} />
        ) : layout_type === 'stack' ? (
          <StackLayout initial_data={initial_data} pointers={pointers} traceHistory={trace.slice(0, step + 1)} />
        ) : layout_type === 'system' ? (
          <SystemLayout initial_data={initial_data} currentState={currentState} />
        ) : (
          // VARIABLES layout — rich code-aware step visualizer
          <div style={{ width: '100%' }}>
            <VariablesLayout currentState={currentState} trace={trace} step={step} />
          </div>
        )}
      </div>

      {step >= MAX_STEP && MAX_STEP > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          style={{ 
            background: 'var(--success-color)', 
            color: '#fff', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginTop: '16px', 
            marginBottom: '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
          }}
        >
          ✅ Final Result Reached
        </motion.div>
      )}

      {/* Output Console */}
      <TraceLog trace={trace} step={step} setStep={setStep} MAX_STEP={MAX_STEP} />
    </div>
  );
};

export default Visualizer;
