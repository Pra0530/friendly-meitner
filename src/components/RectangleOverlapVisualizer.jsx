import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

export default function RectangleOverlapVisualizer() {
  const canvasRef = useRef(null);

  // Rectangle Coordinates
  const [l1x, setL1x] = useState(0);
  const [l1y, setL1y] = useState(10);
  const [r1x, setR1x] = useState(10);
  const [r1y, setR1y] = useState(0);

  const [l2x, setL2x] = useState(5);
  const [l2y, setL2y] = useState(5);
  const [r2x, setR2x] = useState(15);
  const [r2y, setR2y] = useState(0);

  const [isYUp, setIsYUp] = useState(true);
  const [lang, setLang] = useState('python'); // 'python' or 'js'

  // Dragging state
  const isDraggingRef = useRef(null); // 'rect1' or 'rect2' or null
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const GRID_SCALE = 20;
  const ORIGIN_X = 100;
  const ORIGIN_Y = 300;

  // Math ➔ Canvas conversion
  const mathToCanvas = (x, y) => {
    const cx = ORIGIN_X + x * GRID_SCALE;
    const cy = isYUp ? ORIGIN_Y - y * GRID_SCALE : ORIGIN_Y + y * GRID_SCALE;
    return { x: cx, y: cy };
  };

  const canvasToMath = (cx, cy) => {
    const mx = Math.round((cx - ORIGIN_X) / GRID_SCALE);
    const my = isYUp
      ? Math.round((ORIGIN_Y - cy) / GRID_SCALE)
      : Math.round((cy - ORIGIN_Y) / GRID_SCALE);
    return { x: mx, y: my };
  };

  // Conditions
  const cond1 = l1x > r2x;
  const cond2 = l2x > r1x;
  const cond3 = isYUp ? r1y > l2y : l1y > r2y;
  const cond4 = isYUp ? r2y > l1y : l2y > r1y;

  const isSeparated = cond1 || cond2 || cond3 || cond4;
  const isOverlap = !isSeparated;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID_SCALE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SCALE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, ORIGIN_Y); ctx.lineTo(canvas.width, ORIGIN_Y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ORIGIN_X, 0); ctx.lineTo(ORIGIN_X, canvas.height); ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText('(0,0)', ORIGIN_X - 25, ORIGIN_Y + 15);

    // Draw Rect 1 (Blue)
    drawRect(ctx, { l: { x: l1x, y: l1y }, r: { x: r1x, y: r1y } }, 'rgba(56, 189, 248, 0.3)', '#38bdf8', 'Rect 1');
    // Draw Rect 2 (Orange)
    drawRect(ctx, { l: { x: l2x, y: l2y }, r: { x: r2x, y: r2y } }, 'rgba(251, 146, 60, 0.3)', '#fb923c', 'Rect 2');

    // Draw Intersection Region
    const xLeft = Math.max(Math.min(l1x, r1x), Math.min(l2x, r2x));
    const xRight = Math.min(Math.max(l1x, r1x), Math.max(l2x, r2x));
    const yBottom = Math.max(Math.min(l1y, r1y), Math.min(l2y, r2y));
    const yTop = Math.min(Math.max(l1y, r1y), Math.max(l2y, r2y));

    if (xLeft < xRight && yBottom < yTop) {
      const pTL = mathToCanvas(xLeft, yTop);
      const pBR = mathToCanvas(xRight, yBottom);
      const rx = Math.min(pTL.x, pBR.x);
      const ry = Math.min(pTL.y, pBR.y);
      const rw = Math.abs(pBR.x - pTL.x);
      const rh = Math.abs(pBR.y - pTL.y);

      ctx.fillStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.strokeRect(rx, ry, rw, rh);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Outfit';
      ctx.fillText('✨ OVERLAP', rx + rw / 2 - 30, ry + rh / 2 + 4);
    }
  };

  const drawRect = (ctx, rect, fillColor, strokeColor, label) => {
    const pTL = mathToCanvas(rect.l.x, rect.l.y);
    const pBR = mathToCanvas(rect.r.x, rect.r.y);
    const x = Math.min(pTL.x, pBR.x);
    const y = Math.min(pTL.y, pBR.y);
    const w = Math.abs(pBR.x - pTL.x);
    const h = Math.abs(pBR.y - pTL.y);

    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Corners
    drawPoint(ctx, pTL.x, pTL.y, strokeColor, `l(${rect.l.x},${rect.l.y})`);
    drawPoint(ctx, pBR.x, pBR.y, strokeColor, `r(${rect.r.x},${rect.r.y})`);

    ctx.fillStyle = strokeColor;
    ctx.font = 'bold 11px Outfit';
    ctx.fillText(label, x + 6, y + 16);
  };

  const drawPoint = (ctx, cx, cy, color, text) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(text, cx + 6, cy - 4);
  };

  useEffect(() => {
    draw();
  }, [l1x, l1y, r1x, r1y, l2x, l2y, r2x, r2y, isYUp]);

  // Mouse Drag Handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const p1TL = mathToCanvas(l1x, l1y);
    const p1BR = mathToCanvas(r1x, r1y);
    const p2TL = mathToCanvas(l2x, l2y);
    const p2BR = mathToCanvas(r2x, r2y);

    // Rect 1 hit test
    if (mx >= Math.min(p1TL.x, p1BR.x) && mx <= Math.max(p1TL.x, p1BR.x) &&
        my >= Math.min(p1TL.y, p1BR.y) && my <= Math.max(p1TL.y, p1BR.y)) {
      isDraggingRef.current = 'rect1';
      const mMath = canvasToMath(mx, my);
      dragOffsetRef.current = { x: mMath.x - l1x, y: mMath.y - l1y };
      return;
    }

    // Rect 2 hit test
    if (mx >= Math.min(p2TL.x, p2BR.x) && mx <= Math.max(p2TL.x, p2BR.x) &&
        my >= Math.min(p2TL.y, p2BR.y) && my <= Math.max(p2TL.y, p2BR.y)) {
      isDraggingRef.current = 'rect2';
      const mMath = canvasToMath(mx, my);
      dragOffsetRef.current = { x: mMath.x - l2x, y: mMath.y - l2y };
      return;
    }
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const mMath = canvasToMath(mx, my);

    if (isDraggingRef.current === 'rect1') {
      const w = r1x - l1x;
      const h = r1y - l1y;
      const newL1x = mMath.x - dragOffsetRef.current.x;
      const newL1y = mMath.y - dragOffsetRef.current.y;
      setL1x(newL1x);
      setL1y(newL1y);
      setR1x(newL1x + w);
      setR1y(newL1y + h);
    } else if (isDraggingRef.current === 'rect2') {
      const w = r2x - l2x;
      const h = r2y - l2y;
      const newL2x = mMath.x - dragOffsetRef.current.x;
      const newL2y = mMath.y - dragOffsetRef.current.y;
      setL2x(newL2x);
      setL2y(newL2y);
      setR2x(newL2x + w);
      setR2y(newL2y + h);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = null;
  };

  const runPreset = (type) => {
    if (type === 'overlap') {
      setL1x(0); setL1y(10); setR1x(10); setR1y(0);
      setL2x(5); setL2y(5);  setR2x(15); setR2y(0);
    } else if (type === 'separate') {
      setL1x(0); setL1y(10); setR1x(5);  setR1y(0);
      setL2x(8); setL2y(10); setR2x(15); setR2y(0);
    } else if (type === 'nested') {
      setL1x(0); setL1y(12); setR1x(18); setR1y(0);
      setL2x(4); setL2y(8);  setR2x(12); setR2y(3);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl">
      {/* LEFT: 2D Canvas & Controls */}
      <div className="flex flex-col bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>2D Grid Canvas</span>
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => runPreset('overlap')} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded border border-slate-700">Overlap</button>
            <button onClick={() => runPreset('separate')} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded border border-slate-700">Separate</button>
            <button onClick={() => runPreset('nested')} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded border border-slate-700">Nested</button>
          </div>
        </div>

        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col items-center justify-center">
          <canvas
            ref={canvasRef}
            width={540}
            height={360}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="bg-slate-950 border border-slate-800 rounded-lg shadow-inner cursor-crosshair max-w-full"
          />
          <span className="text-[11px] text-slate-400 mt-2">💡 Tip: Click and drag Rect 1 (Blue) or Rect 2 (Orange) directly on the grid!</span>
        </div>

        {/* Coordinate Input Controls */}
        <div className="p-4 grid grid-cols-2 gap-4 bg-slate-950/40 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 border-l-4 border-l-sky-400 space-y-2">
            <span className="font-bold text-sky-400 block">Rect 1 (Blue)</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">l1:</span>
              <span>X:</span>
              <input type="number" value={l1x} onChange={e => setL1x(Number(e.target.value))} className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono" />
              <span>Y:</span>
              <input type="number" value={l1y} onChange={e => setL1y(Number(e.target.value))} className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">r1:</span>
              <span>X:</span>
              <input type="number" value={r1x} onChange={e => setR1x(Number(e.target.value))} className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono" />
              <span>Y:</span>
              <input type="number" value={r1y} onChange={e => setR1y(Number(e.target.value))} className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono" />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 border-l-4 border-l-orange-400 space-y-2">
            <span className="font-bold text-orange-400 block">Rect 2 (Orange)</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">l2:</span>
              <span>X:</span>
              <input type="number" value={l2x} onChange={e => setL2x(Number(e.target.value))} className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono" />
              <span>Y:</span>
              <input type="number" value={l2y} onChange={e => setL2y(Number(e.target.value))} className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">r2:</span>
              <span>X:</span>
              <input type="number" value={r2x} onChange={e => setR2x(Number(e.target.value))} className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono" />
              <span>Y:</span>
              <input type="number" value={r2y} onChange={e => setR2y(Number(e.target.value))} className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono" />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Algorithm Condition Debugger */}
      <div className="flex flex-col bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>Overlap Algorithm Debugger</span>
          </h2>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={isYUp} onChange={e => setIsYUp(e.target.checked)} className="accent-indigo-500 rounded" />
            <span>Math Y-Up Space</span>
          </label>
        </div>

        {/* Result Banner */}
        <div className={`p-4 mx-4 mt-4 rounded-xl border flex items-center gap-3 transition-all ${isOverlap ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
          {isOverlap ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <XCircle className="w-6 h-6 text-rose-400 shrink-0" />}
          <div>
            <div className="font-extrabold text-base tracking-wide">
              {isOverlap ? 'RECTANGLES OVERLAP (True)' : "RECTANGLES DON'T OVERLAP (False)"}
            </div>
            <div className="text-xs opacity-80 font-mono">
              {isOverlap ? 'All 4 separation conditions evaluated to FALSE' : 'Separation condition satisfied'}
            </div>
          </div>
        </div>

        {/* Language Code Snippet */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>ALGORITHM CODE</span>
            <div className="flex gap-1">
              <button onClick={() => setLang('python')} className={`px-2 py-0.5 rounded text-[11px] ${lang === 'python' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Python</button>
              <button onClick={() => setLang('js')} className={`px-2 py-0.5 rounded text-[11px] ${lang === 'js' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>JavaScript</button>
            </div>
          </div>
          <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-indigo-300 overflow-x-auto">
            {lang === 'python' ? `def do_overlap(l1, r1, l2, r2):
    if l1.x > r2.x or l2.x > r1.x:
        return False  # Horizontal separation
    if ${isYUp ? 'r1.y > l2.y or r2.y > l1.y' : 'l1.y > r2.y or l2.y > r1.y'}:
        return False  # Vertical separation
    return True  # Overlapping!` : `function doOverlap(l1, r1, l2, r2) {
    if (l1.x > r2.x || l2.x > r1.x) return false;
    if (${isYUp ? 'r1.y > l2.y || r2.y > l1.y' : 'l1.y > r2.y || l2.y > r1.y'}) return false;
    return true;
}`}
          </pre>
        </div>

        {/* 4 Conditions Cards */}
        <div className="p-4 flex-grow space-y-3">
          <div className="text-xs font-semibold text-slate-400">REAL-TIME BOUNDARY CONDITIONS:</div>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className={`p-3 rounded-lg border bg-slate-950 ${cond1 ? 'border-rose-500/50 text-rose-300' : 'border-slate-800 text-slate-300'}`}>
              <div className="text-[11px] font-sans text-slate-400">1. Rect 1 Right of Rect 2?</div>
              <div className="font-bold text-sm mt-1">{cond1 ? 'TRUE (Separated)' : 'FALSE'}</div>
              <div className="text-[10px] text-slate-500">l1.x &gt; r2.x ({l1x} &gt; {r2x})</div>
            </div>

            <div className={`p-3 rounded-lg border bg-slate-950 ${cond2 ? 'border-rose-500/50 text-rose-300' : 'border-slate-800 text-slate-300'}`}>
              <div className="text-[11px] font-sans text-slate-400">2. Rect 2 Right of Rect 1?</div>
              <div className="font-bold text-sm mt-1">{cond2 ? 'TRUE (Separated)' : 'FALSE'}</div>
              <div className="text-[10px] text-slate-500">l2.x &gt; r1.x ({l2x} &gt; {r1x})</div>
            </div>

            <div className={`p-3 rounded-lg border bg-slate-950 ${cond3 ? 'border-rose-500/50 text-rose-300' : 'border-slate-800 text-slate-300'}`}>
              <div className="text-[11px] font-sans text-slate-400">3. Rect 1 Above Rect 2?</div>
              <div className="font-bold text-sm mt-1">{cond3 ? 'TRUE (Separated)' : 'FALSE'}</div>
              <div className="text-[10px] text-slate-500">{isYUp ? `r1.y > l2.y (${r1y} > ${l2y})` : `l1.y > r2.y (${l1y} > ${r2y})`}</div>
            </div>

            <div className={`p-3 rounded-lg border bg-slate-950 ${cond4 ? 'border-rose-500/50 text-rose-300' : 'border-slate-800 text-slate-300'}`}>
              <div className="text-[11px] font-sans text-slate-400">4. Rect 2 Above Rect 1?</div>
              <div className="font-bold text-sm mt-1">{cond4 ? 'TRUE (Separated)' : 'FALSE'}</div>
              <div className="text-[10px] text-slate-500">{isYUp ? `r2.y > l1.y (${r2y} > ${l1y})` : `l2.y > r1.y (${l2y} > ${r1y})`}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
