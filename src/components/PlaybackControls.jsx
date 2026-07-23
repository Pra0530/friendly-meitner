import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PlaybackControls = ({ step, setStep, isPlaying, setIsPlaying, MAX_STEP, playbackSpeed, setPlaybackSpeed }) => {
  const trackRef = useRef(null);

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

  const percent = MAX_STEP > 0 ? (step / MAX_STEP) * 100 : 0;

  // Handle timeline scrubber drag and click events
  const handleTimelineClick = (e) => {
    if (!trackRef.current || MAX_STEP === 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const computedPercent = Math.max(0, Math.min(1, clickX / rect.width));
    setStep(Math.round(computedPercent * MAX_STEP));
  };

  const handleMouseDown = (e) => {
    handleTimelineClick(e);
    const handleMouseMove = (moveEvent) => {
      handleTimelineClick(moveEvent);
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex flex-col gap-3.5 w-full mb-4 font-sans">
      {/* Buttons and Stats deck */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={reset} 
            title="Reset"
            className="hover:bg-neutral-800 text-neutral-300 h-8 w-8 rounded-lg"
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setStep(Math.max(0, step - 1))} 
            title="Previous Step"
            className="hover:bg-neutral-800 text-neutral-300 h-8 w-8 rounded-lg"
          >
            <SkipBack className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleTogglePlay} 
            title={isPlaying ? "Pause" : "Play"}
            className="hover:bg-neutral-800 text-neutral-300 h-8 w-8 rounded-lg"
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setStep(Math.min(MAX_STEP, step + 1))} 
            title="Next Step"
            className="hover:bg-neutral-800 text-neutral-300 h-8 w-8 rounded-lg"
          >
            <SkipForward className="size-4" />
          </Button>
          
          <Select 
            value={String(playbackSpeed)} 
            onValueChange={(val) => setPlaybackSpeed(Number(val))}
          >
            <SelectTrigger className="w-[84px] h-8 bg-neutral-900 border-neutral-800 text-neutral-200" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-950 border-neutral-800 text-neutral-200">
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-neutral-500 text-xs font-mono">
          Step {step} / {MAX_STEP}
        </div>
      </div>
      
      {/* ── Custom Animated Timeline Scrubber ── */}
      <div 
        ref={trackRef}
        onMouseDown={handleMouseDown}
        className="relative w-full h-6 flex items-center cursor-pointer select-none touch-none"
      >
        {/* Track Line */}
        <div className="w-full h-[6px] bg-neutral-800 rounded-full relative overflow-visible">
          
          {/* Spring-animated glowing progress fill */}
          <motion.div 
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.45)]"
          />

          {/* Stepper Ticks (Dotted spring timeline) */}
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
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 cursor-pointer"
                style={{ left: leftOffset }}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.4 : 1.0,
                    backgroundColor: isActive 
                      ? '#ffffff' 
                      : isCompleted 
                        ? 'var(--accent-color)' 
                        : '#3b3b4f',
                    boxShadow: isActive 
                      ? '0 0 12px rgba(56, 189, 248, 0.8)' 
                      : 'none'
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`size-2 rounded-full border ${
                    isActive ? 'border-blue-500' : 'border-transparent'
                  }`}
                  title={`Jump to step ${idx}`}
                />
              </div>
            );
          })}

          {/* Floating Spring Handle (for continuous scroll when there are many steps) */}
          {(MAX_STEP > 25 || MAX_STEP === 0) && (
            <motion.div
              animate={{ left: `${percent}%` }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 bg-white border-[3px] border-blue-500 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.7)] z-20"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;
