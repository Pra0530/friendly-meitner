import React, { useState } from 'react';
import { Sparkles, Layers, Cpu, ChevronDown, ChevronUp, CheckCircle, Lightbulb } from 'lucide-react';
import RectangleOverlapVisualizer from './RectangleOverlapVisualizer';
import Visualizer from './Visualizer';

export default function LiveAnalysisPanel({
  detectedCategory,
  analysisData,
  isAnalyzing,
  aiData,
  step,
  setStep,
  isPlaying,
  setIsPlaying,
  insight
}) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  const getCategoryBadge = () => {
    if (detectedCategory === 'rectangle-overlap') {
      return {
        label: '📐 Rectangle Overlap',
        color: 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
      };
    }
    return {
      label: '⚡ General Algorithm Trace',
      color: 'bg-blue-950 text-blue-300 border-blue-500/40'
    };
  };

  const badge = getCategoryBadge();

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-1">
      {/* Category & Approach Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono text-slate-400">DETECTED CATEGORY:</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badge.color}`}>
              {badge.label}
            </span>
          </div>

          {isAnalyzing && (
            <span className="text-xs text-amber-400 animate-pulse font-mono">
              Analyzing code buffer...
            </span>
          )}
        </div>

        {/* Current Approach Summary */}
        {analysisData && (
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Approach: {analysisData.approachName}</span>
              </span>
              {analysisData.alternativeApproaches?.length > 0 && (
                <button
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono transition"
                >
                  <Lightbulb className="w-3 h-3 text-amber-400" />
                  <span>{analysisData.alternativeApproaches.length} Alternative(s)</span>
                  {showAlternatives ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {analysisData.approachSummary}
            </p>

            {/* Alternative Approaches Collapsible Drawer */}
            {showAlternatives && analysisData.alternativeApproaches?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-fadeIn">
                <span className="text-[11px] font-bold text-amber-400 tracking-wide uppercase font-mono">
                  Alternative Approaches Available:
                </span>
                {analysisData.alternativeApproaches.map((alt, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900/90 rounded border border-slate-800 space-y-1">
                    <div className="text-xs font-semibold text-indigo-300">
                      {idx + 1}. {alt.name}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-normal">
                      {alt.summary}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Visualizer Area */}
      <div className="flex-grow min-h-0">
        {detectedCategory === 'rectangle-overlap' ? (
          <RectangleOverlapVisualizer />
        ) : aiData ? (
          <Visualizer
            step={step}
            setStep={setStep}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            aiData={aiData}
            insight={insight}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl min-h-[300px]">
            <Cpu className="w-12 h-12 text-blue-500/40 mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-200 mb-1">Ready to Visualize</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Type or paste code on the left. On pause (~800ms debounce), CodeMaster will detect the category family and render live 2D animations!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
