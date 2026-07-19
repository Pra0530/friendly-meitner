import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const PlaybackControls = ({ step, setStep, isPlaying, setIsPlaying, MAX_STEP, playbackSpeed, setPlaybackSpeed }) => {
  const sliderRef = useRef(null);

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

  // Compute percentage of progress
  const percent = MAX_STEP > 0 ? (step / MAX_STEP) * 100 : 0;

  // Handle clicking and dragging on the timeline track
  const updateStepFromClick = (e) => {
    if (!sliderRef.current || MAX_STEP === 0) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const calculatedPercentage = Math.max(0, Math.min(1, clickX / width));
    const targetStep = Math.round(calculatedPercentage * MAX_STEP);
    setStep(targetStep);
  };

  const handleMouseDown = (e) => {
    updateStepFromClick(e);
    
    const handleMouseMove = (moveEvent) => {
      updateStepFromClick(moveEvent);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
          Step {step} / {MAX_STEP}
        </div>
      </div>
      
      {/* ── Premium Custom Timeline Slider ── */}
      <div 
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          userSelect: 'none',
          touchAction: 'none'
        }}
      >
        {/* Track Line */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '3px',
          position: 'relative',
          overflow: 'visible'
        }}>
          {/* Glowing Progress Fill */}
          <motion.div 
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent-color) 0%, #38bdf8 100%)',
              borderRadius: '3px',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.45)'
            }}
          />

          {/* Step Ticks (Dotted Trail) */}
          {MAX_STEP > 0 && MAX_STEP <= 25 && Array.from({ length: MAX_STEP + 1 }).map((_, idx) => {
            const isCompleted = idx <= step;
            const isActive = idx === step;
            const leftOffset = `${(idx / MAX_STEP) * 100}%`;
            
            return (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setStep(idx);
                }}
                style={{
                  position: 'absolute',
                  left: leftOffset,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isActive ? '12px' : '6px',
                  height: isActive ? '12px' : '6px',
                  borderRadius: '50%',
                  background: isActive ? '#fff' : isCompleted ? 'var(--accent-color)' : 'rgba(255,255,255,0.2)',
                  border: isActive ? '2.5px solid var(--accent-color)' : 'none',
                  boxShadow: isActive ? '0 0 12px rgba(56, 189, 248, 0.8)' : 'none',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 2,
                  cursor: 'pointer'
                }}
                title={`Jump to step ${idx}`}
              />
            );
          })}

          {/* Floating Handle (for continuous scroll when there are many steps) */}
          {(MAX_STEP > 25 || MAX_STEP === 0) && (
            <motion.div
              animate={{ left: `${percent}%` }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#fff',
                border: '3px solid var(--accent-color)',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.7)',
                zIndex: 3
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;
