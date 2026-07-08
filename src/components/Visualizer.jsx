import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Zap, RotateCcw } from 'lucide-react';
import ArrayLayout from './layouts/ArrayLayout';
import TreeLayout from './layouts/TreeLayout';
import MatrixLayout from './layouts/MatrixLayout';
import StackLayout from './layouts/StackLayout';
import GraphLayout from './layouts/GraphLayout';
import TraceLog from './TraceLog';
import PlaybackControls from './PlaybackControls';
import VariablePanel from './VariablePanel';
import InsightPanel from './InsightPanel';

const Visualizer = ({ step, setStep, isPlaying, setIsPlaying, aiData, insight }) => {
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1);
  const layout_type = (aiData?.layout_type || 'ARRAY').toLowerCase();
  const initial_data = aiData?.initial_data || [];
  const root_id = aiData?.root_id;
  const trace = aiData?.trace || [];
  const MAX_STEP = Math.max(0, trace.length - 1);

  const currentState = trace[step] || trace[0] || {};
  const pointers = currentState?.pointers || {};
  const variables = { ...currentState?.variables };
  
  // If a pointer doesn't exist in the data (like when it becomes null or -1)
  // we should display it in the variables section so the user knows it's null
  Object.entries(pointers).forEach(([pName, pVal]) => {
    if (pVal === -1 || pVal === null || pVal === "null") {
      variables[pName] = "null";
    }
  });

  const explanation = currentState?.explanation || "";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      <div className="controls-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Zap size={20} color="var(--warning-color)" />
          <h2 style={{ fontSize: '18px', fontWeight: '600' }} className="text-gradient">Live Execution</h2>
        </div>
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

      {/* Variables Display */}
      <VariablePanel traceHistory={trace.slice(0, step + 1)} currentVariables={variables} />

      {/* Insight Panel */}
      <InsightPanel insight={insight} />

      {/* Dynamic Layout Canvas */}
      <div className="canvas-area" style={{ overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', opacity: 0.5 }}>
          <Zap size={48} style={{ marginBottom: '16px' }} />
          <div>Simple Variable Execution</div>
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
