import React, { useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

const PlaybackControls = ({ step, setStep, isPlaying, setIsPlaying, MAX_STEP, playbackSpeed, setPlaybackSpeed }) => {

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setStep((prev) => {
          if (prev >= MAX_STEP) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setIsPlaying, setStep, MAX_STEP, playbackSpeed]);

  const handleTogglePlay = () => {
    if (step >= MAX_STEP && !isPlaying) setStep(0); 
    setIsPlaying(!isPlaying);
  };

  const reset = () => {
    setStep(0);
    setIsPlaying(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="icon-button" onClick={reset} title="Reset">
            <RotateCcw size={18} />
          </button>
          <button className="icon-button" onClick={() => setStep(Math.max(0, step - 1))} title="Previous Step">
            <SkipBack size={18} />
          </button>
          <button className="icon-button" onClick={handleTogglePlay} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className="icon-button" onClick={() => setStep(Math.min(MAX_STEP, step + 1))} title="Next Step">
            <SkipForward size={18} />
          </button>
          
          <select 
            value={playbackSpeed} 
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            style={{ 
              background: 'rgba(0,0,0,0.3)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border-glass)', 
              borderRadius: '6px', 
              padding: '4px 8px',
              marginLeft: '8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
          </select>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          Step {step} / {MAX_STEP}
        </div>
      </div>
      
      {/* Scrub Bar */}
      <input 
        type="range" 
        min={0} 
        max={MAX_STEP} 
        value={step} 
        onChange={(e) => setStep(Number(e.target.value))}
        style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-color)' }}
      />
    </div>
  );
};

export default PlaybackControls;
