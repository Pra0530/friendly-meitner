/**
 * Interactive Rectangle Overlap Visualizer & Animated Test Suite
 * Handles 2D canvas rendering, drag interactions, coordinate space conversions,
 * step-by-step logic evaluations, and animated test scenario runs.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const tabWebTesting = document.getElementById('tab-web-testing');
  const tabRectOverlap = document.getElementById('tab-rect-overlap');
  const sectionWebTesting = document.getElementById('section-web-testing');
  const sectionRectOverlap = document.getElementById('section-rect-overlap');

  tabWebTesting.addEventListener('click', () => {
    tabWebTesting.classList.add('active');
    tabRectOverlap.classList.remove('active');
    sectionWebTesting.classList.add('active');
    sectionRectOverlap.classList.remove('active');
  });

  tabRectOverlap.addEventListener('click', () => {
    tabRectOverlap.classList.add('active');
    tabWebTesting.classList.remove('active');
    sectionRectOverlap.classList.add('active');
    sectionWebTesting.classList.remove('active');
    drawCanvas(); // Initial draw on switch
  });

  // Canvas & Context Setup
  const canvas = document.getElementById('rect-canvas');
  const ctx = canvas.getContext('2d');

  // Input Coordinate Elements
  const inputL1x = document.getElementById('l1-x');
  const inputL1y = document.getElementById('l1-y');
  const inputR1x = document.getElementById('r1-x');
  const inputR1y = document.getElementById('r1-y');

  const inputL2x = document.getElementById('l2-x');
  const inputL2y = document.getElementById('l2-y');
  const inputR2x = document.getElementById('r2-x');
  const inputR2y = document.getElementById('r2-y');

  // Controls & Evaluation UI Elements
  const toggleYUp = document.getElementById('toggle-y-up');
  const overlapBanner = document.getElementById('overlap-banner');
  const bannerText = document.getElementById('banner-text');

  const badgeCond1 = document.getElementById('badge-cond-1');
  const badgeCond2 = document.getElementById('badge-cond-2');
  const badgeCond3 = document.getElementById('badge-cond-3');
  const badgeCond4 = document.getElementById('badge-cond-4');

  const exprVal1 = document.getElementById('expr-val-1');
  const exprVal2 = document.getElementById('expr-val-2');
  const exprVal3 = document.getElementById('expr-val-3');
  const exprVal4 = document.getElementById('expr-val-4');

  const codeCond3 = document.getElementById('code-cond-3');
  const codeCond4 = document.getElementById('code-cond-4');

  const btnPresetOverlap = document.getElementById('btn-preset-overlap');
  const btnPresetSeparate = document.getElementById('btn-preset-separate');
  const btnPresetContained = document.getElementById('btn-preset-contained');

  const btnRectRun = document.getElementById('btn-rect-run');
  const btnRectStep = document.getElementById('btn-rect-step');
  const btnRectReset = document.getElementById('btn-rect-reset');

  const btnLangPython = document.getElementById('btn-lang-python');
  const btnLangJS = document.getElementById('btn-lang-js');
  const rectCodeDisplay = document.getElementById('rect-code-display');

  // State Variables
  let currentLang = 'python'; // 'python' or 'js'
  let isDraggingRect1 = false;
  let isDraggingRect2 = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let animationId = null;

  // Grid Scale: 1 math unit = 20 canvas pixels
  const GRID_SCALE = 20;
  const ORIGIN_X = 100; // Canvas pixel offset for X=0
  const ORIGIN_Y = 320; // Canvas pixel offset for Y=0 (bottom-left area)

  // Default driver values from user's code snippet:
  // Rect 1: l1(0, 10), r1(10, 0)
  // Rect 2: l2(5, 5),   r2(15, 0)
  let rect1 = { l: { x: 0, y: 10 }, r: { x: 10, y: 0 } };
  let rect2 = { l: { x: 5, y: 5 }, r: { x: 15, y: 0 } };

  // Read inputs to model
  function readInputsToModel() {
    rect1.l.x = parseFloat(inputL1x.value) || 0;
    rect1.l.y = parseFloat(inputL1y.value) || 0;
    rect1.r.x = parseFloat(inputR1x.value) || 0;
    rect1.r.y = parseFloat(inputR1y.value) || 0;

    rect2.l.x = parseFloat(inputL2x.value) || 0;
    rect2.l.y = parseFloat(inputL2y.value) || 0;
    rect2.r.x = parseFloat(inputR2x.value) || 0;
    rect2.r.y = parseFloat(inputR2y.value) || 0;
  }

  // Sync model to input fields
  function updateInputsFromModel() {
    inputL1x.value = rect1.l.x;
    inputL1y.value = rect1.l.y;
    inputR1x.value = rect1.r.x;
    inputR1y.value = rect1.r.y;

    inputL2x.value = rect2.l.x;
    inputL2y.value = rect2.l.y;
    inputR2x.value = rect2.r.x;
    inputR2y.value = rect2.r.y;
  }

  // Coordinate Conversion Helpers (Math ➔ Canvas Pixels)
  function mathToCanvas(x, y) {
    const isYUp = toggleYUp.checked;
    const canvasX = ORIGIN_X + x * GRID_SCALE;
    const canvasY = isYUp ? ORIGIN_Y - y * GRID_SCALE : ORIGIN_Y + y * GRID_SCALE;
    return { x: canvasX, y: canvasY };
  }

  function canvasToMath(canvasX, canvasY) {
    const isYUp = toggleYUp.checked;
    const mathX = Math.round((canvasX - ORIGIN_X) / GRID_SCALE);
    const mathY = isYUp 
      ? Math.round((ORIGIN_Y - canvasY) / GRID_SCALE)
      : Math.round((canvasY - ORIGIN_Y) / GRID_SCALE);
    return { x: mathX, y: mathY };
  }

  // Main Canvas Rendering Loop
  function drawCanvas() {
    readInputsToModel();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Grid Background & Axes
    drawGrid();

    // 2. Draw Rectangles
    drawRectangle(rect1, 'rgba(56, 189, 248, 0.35)', '#38bdf8', 'Rect 1 (l1, r1)');
    drawRectangle(rect2, 'rgba(251, 146, 60, 0.35)', '#fb923c', 'Rect 2 (l2, r2)');

    // 3. Draw Overlap Highlight Region (if overlapping)
    drawOverlapRegion();

    // 4. Evaluate Overlap Conditions & Update Badges
    evaluateOverlapLogic();
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Grid lines
    for (let x = 0; x <= canvas.width; x += GRID_SCALE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SCALE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Axes lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, ORIGIN_Y);
    ctx.lineTo(canvas.width, ORIGIN_Y);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(ORIGIN_X, 0);
    ctx.lineTo(ORIGIN_X, canvas.height);
    ctx.stroke();

    // Origin label (0,0)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText('(0,0)', ORIGIN_X - 25, ORIGIN_Y + 15);
  }

  function drawRectangle(rect, fillColor, strokeColor, label) {
    const pTopLeft = mathToCanvas(rect.l.x, rect.l.y);
    const pBottomRight = mathToCanvas(rect.r.x, rect.r.y);

    const x = Math.min(pTopLeft.x, pBottomRight.x);
    const y = Math.min(pTopLeft.y, pBottomRight.y);
    const width = Math.abs(pBottomRight.x - pTopLeft.x);
    const height = Math.abs(pBottomRight.y - pTopLeft.y);

    // Fill & Stroke
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Corner points
    drawPoint(pTopLeft.x, pTopLeft.y, strokeColor, `l(${rect.l.x},${rect.l.y})`);
    drawPoint(pBottomRight.x, pBottomRight.y, strokeColor, `r(${rect.r.x},${rect.r.y})`);

    // Label inside
    ctx.fillStyle = strokeColor;
    ctx.font = 'bold 11px Outfit';
    ctx.fillText(label, x + 6, y + 16);
  }

  function drawPoint(cx, cy, color, text) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(text, cx + 6, cy - 6);
  }

  function drawOverlapRegion() {
    // Math coordinates overlap box
    const xLeft = Math.max(Math.min(rect1.l.x, rect1.r.x), Math.min(rect2.l.x, rect2.r.x));
    const xRight = Math.min(Math.max(rect1.l.x, rect1.r.x), Math.max(rect2.l.x, rect2.r.x));
    
    const yBottom = Math.max(Math.min(rect1.l.y, rect1.r.y), Math.min(rect2.l.y, rect2.r.y));
    const yTop = Math.min(Math.max(rect1.l.y, rect1.r.y), Math.max(rect2.l.y, rect2.r.y));

    if (xLeft < xRight && yBottom < yTop) {
      const pTopLeft = mathToCanvas(xLeft, yTop);
      const pBottomRight = mathToCanvas(xRight, yBottom);

      const x = Math.min(pTopLeft.x, pBottomRight.x);
      const y = Math.min(pTopLeft.y, pBottomRight.y);
      const width = Math.abs(pBottomRight.x - pTopLeft.x);
      const height = Math.abs(pBottomRight.y - pTopLeft.y);

      // Glowing purple hatch fill
      ctx.fillStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.fillRect(x, y, width, height);

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Outfit';
      ctx.fillText('✨ OVERLAP REGION', x + width / 2 - 50, y + height / 2 + 4);
    }
  }

  // Evaluate overlap conditions matching user's Python code
  function evaluateOverlapLogic() {
    const isYUp = toggleYUp.checked;

    // Conditions
    // 1. Is Rect 1 to the right of Rect 2?
    const cond1 = rect1.l.x > rect2.r.x;
    
    // 2. Is Rect 2 to the right of Rect 1?
    const cond2 = rect2.l.x > rect1.r.x;

    let cond3, cond4;

    if (isYUp) {
      // Y-Up space (Standard Math Cartesian)
      // r1.y is bottom of R1, l2.y is top of R2 -> r1.y > l2.y means R1 is strictly above R2
      cond3 = rect1.r.y > rect2.l.y;
      cond4 = rect2.r.y > rect1.l.y;
      
      codeCond3.innerText = 'r1.y > l2.y';
      codeCond4.innerText = 'r2.y > l1.y';

      exprVal3.innerText = `${rect1.r.y} > ${rect2.l.y}`;
      exprVal4.innerText = `${rect2.r.y} > ${rect1.l.y}`;
    } else {
      // Y-Down space (HTML Canvas / Screen Space)
      cond3 = rect1.l.y > rect2.r.y;
      cond4 = rect2.l.y > rect1.r.y;

      codeCond3.innerText = 'l1.y > r2.y';
      codeCond4.innerText = 'l2.y > r1.y';

      exprVal3.innerText = `${rect1.l.y} > ${rect2.r.y}`;
      exprVal4.innerText = `${rect2.l.y} > ${rect1.r.y}`;
    }

    exprVal1.innerText = `${rect1.l.x} > ${rect2.r.x}`;
    exprVal2.innerText = `${rect2.l.x} > ${rect1.r.x}`;

    updateBadge(badgeCond1, cond1);
    updateBadge(badgeCond2, cond2);
    updateBadge(badgeCond3, cond3);
    updateBadge(badgeCond4, cond4);

    // Overlap result: If ANY condition is true, they DO NOT overlap
    const isSeparated = cond1 || cond2 || cond3 || cond4;
    const isOverlap = !isSeparated;

    if (isOverlap) {
      overlapBanner.className = 'overlap-banner success';
      bannerText.innerText = 'RECTANGLES OVERLAP (do_overlap == True)';
    } else {
      overlapBanner.className = 'overlap-banner error';
      bannerText.innerText = 'RECTANGLES DON\'T OVERLAP (do_overlap == False)';
    }

    updateCodeSnippetHighlight(isOverlap, cond1, cond2, cond3, cond4);
  }

  function updateBadge(badgeEl, isTrue) {
    if (isTrue) {
      badgeEl.className = 'cond-badge fail';
      badgeEl.innerText = 'TRUE (Separated)';
    } else {
      badgeEl.className = 'cond-badge pass';
      badgeEl.innerText = 'FALSE';
    }
  }

  function updateCodeSnippetHighlight(isOverlap, c1, c2, c3, c4) {
    if (currentLang === 'python') {
      rectCodeDisplay.innerHTML = `
<span class="${isOverlap ? '' : 'code-line active'}"><span class="token-keyword">def</span> <span class="token-title">do_overlap</span>(l1, r1, l2, r2):</span>
    <span class="${(c1||c2) ? 'code-line active' : ''}"># Check horizontal separation</span>
    <span class="${(c1||c2) ? 'code-line active' : ''}"><span class="token-keyword">if</span> l1.x &gt; r2.x <span class="token-keyword">or</span> l2.x &gt; r1.x:</span>
        <span class="${(c1||c2) ? 'code-line active' : ''}"><span class="token-keyword">return</span> <span class="token-bool">False</span></span>

    <span class="${(c3||c4) ? 'code-line active' : ''}"># Check vertical separation</span>
    <span class="${(c3||c4) ? 'code-line active' : ''}"><span class="token-keyword">if</span> r1.y &gt; l2.y <span class="token-keyword">or</span> r2.y &gt; l1.y:</span>
        <span class="${(c3||c4) ? 'code-line active' : ''}"><span class="token-keyword">return</span> <span class="token-bool">False</span></span>

    <span class="${isOverlap ? 'code-line active' : ''}"><span class="token-keyword">return</span> <span class="token-bool">True</span>  <span class="token-comment"># Overlap Verified!</span></span>
`;
    } else {
      rectCodeDisplay.innerHTML = `
<span class="${isOverlap ? '' : 'code-line active'}"><span class="token-keyword">function</span> <span class="token-title">doOverlap</span>(l1, r1, l2, r2) {</span>
    <span class="${(c1||c2) ? 'code-line active' : ''}">// Check horizontal separation</span>
    <span class="${(c1||c2) ? 'code-line active' : ''}"><span class="token-keyword">if</span> (l1.x &gt; r2.x || l2.x &gt; r1.x) {</span>
        <span class="${(c1||c2) ? 'code-line active' : ''}"><span class="token-keyword">return</span> <span class="token-bool">false</span>;</span>
    <span class="${(c1||c2) ? 'code-line active' : ''}">}</span>

    <span class="${(c3||c4) ? 'code-line active' : ''}">// Check vertical separation</span>
    <span class="${(c3||c4) ? 'code-line active' : ''}"><span class="token-keyword">if</span> (r1.y &gt; l2.y || r2.y &gt; l1.y) {</span>
        <span class="${(c3||c4) ? 'code-line active' : ''}"><span class="token-keyword">return</span> <span class="token-bool">false</span>;</span>
    <span class="${(c3||c4) ? 'code-line active' : ''}">}</span>

    <span class="${isOverlap ? 'code-line active' : ''}"><span class="token-keyword">return</span> <span class="token-bool">true</span>;  <span class="token-comment">// Overlap Verified!</span></span>
<span class="token-keyword">}</span>
`;
    }
  }

  // Drag & Drop Handling on Canvas
  canvas.addEventListener('mousedown', (e) => {
    const rectBounds = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rectBounds.left;
    const mouseY = e.clientY - rectBounds.top;

    const p1TL = mathToCanvas(rect1.l.x, rect1.l.y);
    const p1BR = mathToCanvas(rect1.r.x, rect1.r.y);
    
    const p2TL = mathToCanvas(rect2.l.x, rect2.l.y);
    const p2BR = mathToCanvas(rect2.r.x, rect2.r.y);

    // Check if mouse inside Rect 1
    if (mouseX >= Math.min(p1TL.x, p1BR.x) && mouseX <= Math.max(p1TL.x, p1BR.x) &&
        mouseY >= Math.min(p1TL.y, p1BR.y) && mouseY <= Math.max(p1TL.y, p1BR.y)) {
      isDraggingRect1 = true;
      const mMath = canvasToMath(mouseX, mouseY);
      dragOffsetX = mMath.x - rect1.l.x;
      dragOffsetY = mMath.y - rect1.l.y;
      return;
    }

    // Check if mouse inside Rect 2
    if (mouseX >= Math.min(p2TL.x, p2BR.x) && mouseX <= Math.max(p2TL.x, p2BR.x) &&
        mouseY >= Math.min(p2TL.y, p2BR.y) && mouseY <= Math.max(p2TL.y, p2BR.y)) {
      isDraggingRect2 = true;
      const mMath = canvasToMath(mouseX, mouseY);
      dragOffsetX = mMath.x - rect2.l.x;
      dragOffsetY = mMath.y - rect2.l.y;
      return;
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDraggingRect1 && !isDraggingRect2) return;

    const rectBounds = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rectBounds.left;
    const mouseY = e.clientY - rectBounds.top;
    const mMath = canvasToMath(mouseX, mouseY);

    if (isDraggingRect1) {
      const width = rect1.r.x - rect1.l.x;
      const height = rect1.r.y - rect1.l.y;

      rect1.l.x = mMath.x - dragOffsetX;
      rect1.l.y = mMath.y - dragOffsetY;
      rect1.r.x = rect1.l.x + width;
      rect1.r.y = rect1.l.y + height;
    } else if (isDraggingRect2) {
      const width = rect2.r.x - rect2.l.x;
      const height = rect2.r.y - rect2.l.y;

      rect2.l.x = mMath.x - dragOffsetX;
      rect2.l.y = mMath.y - dragOffsetY;
      rect2.r.x = rect2.l.x + width;
      rect2.r.y = rect2.l.y + height;
    }

    updateInputsFromModel();
    drawCanvas();
  });

  window.addEventListener('mouseup', () => {
    isDraggingRect1 = false;
    isDraggingRect2 = false;
  });

  // Inputs Change Listeners
  [inputL1x, inputL1y, inputR1x, inputR1y, inputL2x, inputL2y, inputR2x, inputR2y].forEach(inp => {
    inp.addEventListener('input', drawCanvas);
  });

  toggleYUp.addEventListener('change', drawCanvas);

  // Preset Buttons
  btnPresetOverlap.addEventListener('click', () => {
    rect1 = { l: { x: 0, y: 10 }, r: { x: 10, y: 0 } };
    rect2 = { l: { x: 5, y: 5 }, r: { x: 15, y: 0 } };
    updateInputsFromModel();
    drawCanvas();
  });

  btnPresetSeparate.addEventListener('click', () => {
    rect1 = { l: { x: 0, y: 10 }, r: { x: 5, y: 0 } };
    rect2 = { l: { x: 8, y: 10 }, r: { x: 15, y: 0 } };
    updateInputsFromModel();
    drawCanvas();
  });

  btnPresetContained.addEventListener('click', () => {
    rect1 = { l: { x: 0, y: 12 }, r: { x: 18, y: 0 } };
    rect2 = { l: { x: 4, y: 8 }, r: { x: 12, y: 3 } };
    updateInputsFromModel();
    drawCanvas();
  });

  btnRectReset.addEventListener('click', () => {
    rect1 = { l: { x: 0, y: 10 }, r: { x: 10, y: 0 } };
    rect2 = { l: { x: 5, y: 5 }, r: { x: 15, y: 0 } };
    updateInputsFromModel();
    drawCanvas();
  });

  // Language Switch
  btnLangPython.addEventListener('click', () => {
    currentLang = 'python';
    btnLangPython.classList.add('active');
    btnLangJS.classList.remove('active');
    drawCanvas();
  });

  btnLangJS.addEventListener('click', () => {
    currentLang = 'js';
    btnLangJS.classList.add('active');
    btnLangPython.classList.remove('active');
    drawCanvas();
  });

  // Smooth Animation Test Suite
  const testScenarios = [
    { name: "Driver Code (Overlap)", r1: { l:{x:0, y:10}, r:{x:10, y:0} }, r2: { l:{x:5, y:5}, r:{x:15, y:0} } },
    { name: "Separated Horizontally", r1: { l:{x:0, y:10}, r:{x:5, y:0} }, r2: { l:{x:8, y:10}, r:{x:15, y:0} } },
    { name: "Separated Vertically", r1: { l:{x:0, y:12}, r:{x:10, y:7} }, r2: { l:{x:0, y:5}, r:{x:10, y:0} } },
    { name: "Fully Contained", r1: { l:{x:0, y:12}, r:{x:18, y:0} }, r2: { l:{x:4, y:8}, r:{x:12, y:3} } }
  ];

  let scenarioIndex = 0;

  function animateToScenario(targetScenario) {
    if (animationId) cancelAnimationFrame(animationId);

    const startR1 = JSON.parse(JSON.stringify(rect1));
    const startR2 = JSON.parse(JSON.stringify(rect2));
    const targetR1 = targetScenario.r1;
    const targetR2 = targetScenario.r2;

    let progress = 0;
    const duration = 400; // ms
    const startTime = performance.now();

    function step(timestamp) {
      const elapsed = timestamp - startTime;
      progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      rect1.l.x = Math.round(startR1.l.x + (targetR1.l.x - startR1.l.x) * ease);
      rect1.l.y = Math.round(startR1.l.y + (targetR1.l.y - startR1.l.y) * ease);
      rect1.r.x = Math.round(startR1.r.x + (targetR1.r.x - startR1.r.x) * ease);
      rect1.r.y = Math.round(startR1.r.y + (targetR1.r.y - startR1.r.y) * ease);

      rect2.l.x = Math.round(startR2.l.x + (targetR2.l.x - startR2.l.x) * ease);
      rect2.l.y = Math.round(startR2.l.y + (targetR2.l.y - startR2.l.y) * ease);
      rect2.r.x = Math.round(startR2.r.x + (targetR2.r.x - startR2.r.x) * ease);
      rect2.r.y = Math.round(startR2.r.y + (targetR2.r.y - startR2.r.y) * ease);

      updateInputsFromModel();
      drawCanvas();

      if (progress < 1) {
        animationId = requestAnimationFrame(step);
      }
    }

    animationId = requestAnimationFrame(step);
  }

  btnRectStep.addEventListener('click', () => {
    scenarioIndex = (scenarioIndex + 1) % testScenarios.length;
    animateToScenario(testScenarios[scenarioIndex]);
  });

  btnRectRun.addEventListener('click', () => {
    let i = 0;
    function runNext() {
      if (i < testScenarios.length) {
        animateToScenario(testScenarios[i]);
        i++;
        setTimeout(runNext, 1200);
      }
    }
    runNext();
  });

  // Initial draw
  drawCanvas();
});
