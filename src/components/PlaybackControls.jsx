import React, { useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <div className="flex flex-col gap-3 w-full mb-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={reset} 
            title="Reset"
            className="hover:bg-neutral-800 text-neutral-300"
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setStep(Math.max(0, step - 1))} 
            title="Previous Step"
            className="hover:bg-neutral-800 text-neutral-300"
          >
            <SkipBack className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleTogglePlay} 
            title={isPlaying ? "Pause" : "Play"}
            className="hover:bg-neutral-800 text-neutral-300"
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setStep(Math.min(MAX_STEP, step + 1))} 
            title="Next Step"
            className="hover:bg-neutral-800 text-neutral-300"
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
      
      {/* ── Shadcn UI Slider with Smooth spring motion ── */}
      <div className="py-2">
        <Slider
          value={[step]}
          onValueChange={(val) => setStep(val[0])}
          min={0}
          max={MAX_STEP || 1}
          className="w-full select-none"
        />
      </div>
    </div>
  );
};

export default PlaybackControls;
