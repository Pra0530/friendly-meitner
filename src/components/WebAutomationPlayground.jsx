import React, { useState, useEffect, useRef } from 'react';
import { Play, SkipForward, RotateCcw, Bug, CheckCircle, XCircle, Lock, AlertTriangle } from 'lucide-react';

export default function WebAutomationPlayground() {
  const [selectedSuite, setSelectedSuite] = useState('loginSuccess');
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [injectBug, setInjectBug] = useState(false);
  const [logs, setLogs] = useState([
    { type: 'info', text: 'Select a test suite and click "Run Entire Test" or "Step Line" to start testing.' }
  ]);

  // Mock Website Screen States
  const [activeScreen, setActiveScreen] = useState('login'); // 'login' or 'dashboard'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loginMessage, setLoginMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [counter, setCounter] = useState(0);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Active element highlight flags
  const [highlightTarget, setHighlightTarget] = useState(null); // ID of element being highlighted
  const [highlightStyle, setHighlightStyle] = useState(''); // 'highlight-action', 'highlight-assert-success', 'highlight-assert-fail'

  const logsEndRef = useRef(null);
  const runTimerRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type, text) => {
    setLogs(prev => [...prev, { type, text, id: Date.now() + Math.random() }]);
  };

  const resetMockSite = () => {
    setUsername('');
    setPassword('');
    setRemember(false);
    setLoginMessage(null);
    setCounter(0);
    setIsDarkTheme(false);
    setActiveScreen('login');
    setHighlightTarget(null);
    setHighlightStyle('');
  };

  const setHighlight = (targetId, styleClass) => {
    setHighlightTarget(targetId);
    setHighlightStyle(styleClass);
  };

  // Test Suite Definitions
  const suites = {
    loginSuccess: [
      {
        code: "// Step 1: Open website URL\nawait page.goto('https://mysandboxapp.com/login');",
        action: () => {
          setActiveScreen('login');
          addLog('action', "page.goto('https://mysandboxapp.com/login')");
          return true;
        }
      },
      {
        code: "// Step 2: Target username input and fill credentials\nconst usernameEl = await page.locator('#username');\nawait usernameEl.fill('admin');",
        action: () => {
          if (injectBug) {
            addLog('info', "BUG INJECTED: Target selector '#user-typo' not found on page!");
            setHighlight('username-group', 'border-red-500 shadow-red-500/50 shadow-lg');
            addLog('error', `Element '#user-typo' not found on page!`);
            return false;
          }
          setHighlight('username-group', 'border-indigo-500 shadow-indigo-500/50 shadow-lg');
          setUsername('admin');
          addLog('action', `Filled username with "admin"`);
          return true;
        }
      },
      {
        code: "// Step 3: Target password input and fill values\nconst passwordEl = await page.locator('#password');\nawait passwordEl.fill('password123');",
        action: () => {
          setHighlight('password-group', 'border-indigo-500 shadow-indigo-500/50 shadow-lg');
          setPassword('password123');
          addLog('action', `Filled password field`);
          return true;
        }
      },
      {
        code: "// Step 4: Toggle remember me checkbox\nawait page.locator('#remember').check();",
        action: () => {
          setHighlight('remember-group', 'border-indigo-500 shadow-indigo-500/50 shadow-lg');
          setRemember(true);
          addLog('action', `Checked 'Remember Me' checkbox`);
          return true;
        }
      },
      {
        code: "// Step 5: Click submit button\nawait page.locator('#login-btn').click();",
        action: () => {
          setHighlight('login-btn', 'border-indigo-500 shadow-indigo-500/50 shadow-lg');
          setLoginMessage({ type: 'success', text: 'Login Successful! Welcome back.' });
          addLog('action', `Clicked '#login-btn'`);
          return true;
        }
      },
      {
        code: "// Step 6: Validate success message visibility\nconst msg = await page.locator('#login-message').innerText();\nexpect(msg).toContain('Login Successful');",
        action: () => {
          setHighlight('login-message', 'border-emerald-500 shadow-emerald-500/50 shadow-lg');
          addLog('assert', `expect('#login-message').toContain('Login Successful')`);
          addLog('success', `Assertion Passed! Success message verified.`);
          return true;
        }
      },
      {
        code: "// Step 7: Confirm dashboard redirection\nawait expect(page).toHaveURL(/dashboard/);",
        action: () => {
          setActiveScreen('dashboard');
          addLog('assert', `expect(URL).toMatch(/dashboard/)`);
          addLog('success', `Redirection Test Passed! Entered Dashboard.`);
          return true;
        }
      }
    ],

    counterTest: [
      {
        code: "// Step 1: Open Dashboard\nawait page.goto('https://mysandboxapp.com/dashboard');",
        action: () => {
          setActiveScreen('dashboard');
          addLog('action', `Navigated to dashboard`);
          return true;
        }
      },
      {
        code: "// Step 2: Verify initial counter starts at 0\nconst val = await page.locator('#counter-value').innerText();\nexpect(parseInt(val)).toBe(0);",
        action: () => {
          setHighlight('counter-area', 'border-emerald-500 shadow-emerald-500/50 shadow-lg');
          addLog('assert', `expect(counterValue).toBe(0)`);
          addLog('success', `Assertion Passed! Counter starting value is 0`);
          return true;
        }
      },
      {
        code: "// Step 3: Loop click '+' button 3 times\nconst btnInc = page.locator('#counter-increment');\nfor (let i = 0; i < 3; i++) {\n  await btnInc.click();\n}",
        action: () => {
          setHighlight('counter-area', 'border-indigo-500 shadow-indigo-500/50 shadow-lg');
          const clicks = injectBug ? 1 : 3;
          if (injectBug) addLog('info', "BUG INJECTED: Button handler failed to register 2 clicks.");
          setCounter(prev => prev + clicks);
          addLog('action', `Clicked '#counter-increment' button ${clicks} times`);
          return true;
        }
      },
      {
        code: "// Step 4: Assert counter equals expected result (3)\nconst updatedVal = await page.locator('#counter-value').innerText();\nexpect(parseInt(updatedVal)).toBe(3);",
        action: () => {
          const expected = 3;
          if (injectBug) {
            setHighlight('counter-area', 'border-red-500 shadow-red-500/50 shadow-lg');
            addLog('assert', `expect(counterValue).toBe(3)`);
            addLog('error', `Assertion Failed! Expected 3, but found 1`);
            return false;
          }
          setHighlight('counter-area', 'border-emerald-500 shadow-emerald-500/50 shadow-lg');
          addLog('assert', `expect(counterValue).toBe(3)`);
          addLog('success', `Assertion Passed! Counter state is 3.`);
          return true;
        }
      }
    ]
  };

  const activeSteps = suites[selectedSuite] || [];

  const handleRunNextStep = () => {
    if (currentStep >= activeSteps.length) {
      setIsRunning(false);
      addLog('success', 'Test suite execution finished.');
      return;
    }

    const stepObj = activeSteps[currentStep];
    const success = stepObj.action();

    if (!success) {
      setIsRunning(false);
      addLog('error', `Test suite halted at step ${currentStep + 1} due to error.`);
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  useEffect(() => {
    if (isRunning) {
      runTimerRef.current = setTimeout(() => {
        handleRunNextStep();
      }, speed);
    }
    return () => clearTimeout(runTimerRef.current);
  }, [isRunning, currentStep, selectedSuite]);

  const handleRunAll = () => {
    if (currentStep >= activeSteps.length) {
      setCurrentStep(0);
      resetMockSite();
    }
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    clearTimeout(runTimerRef.current);
    setCurrentStep(0);
    resetMockSite();
    addLog('info', 'Playground environment reset.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl">
      {/* LEFT: Mock Website */}
      <div className="flex flex-col bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="ml-2 font-medium text-sm text-slate-300">Mock Website</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">index.html</span>
        </div>

        <div className="p-3 bg-slate-950/50 border-b border-slate-800">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-400 font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>https://mysandboxapp.com/{activeScreen}</span>
          </div>
        </div>

        <div className="p-6 flex-grow flex items-center justify-center bg-gradient-to-b from-indigo-950/20 to-transparent min-h-[420px]">
          {activeScreen === 'login' ? (
            <div className="w-full max-w-sm p-6 bg-slate-800/80 rounded-xl border border-slate-700/50 backdrop-blur shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center justify-between">
                <span>Secure Portal Login</span>
              </h3>

              <div id="username-group" className={`p-2 rounded-lg border transition-all ${highlightTarget === 'username-group' ? highlightStyle : 'border-transparent'}`}>
                <label className="text-xs text-slate-400 flex justify-between mb-1">
                  <span>Username</span>
                  <code className="text-[10px] bg-slate-900 text-cyan-400 px-1.5 py-0.5 rounded font-mono">#username</code>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username (e.g. admin)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div id="password-group" className={`p-2 rounded-lg border transition-all ${highlightTarget === 'password-group' ? highlightStyle : 'border-transparent'}`}>
                <label className="text-xs text-slate-400 flex justify-between mb-1">
                  <span>Password</span>
                  <code className="text-[10px] bg-slate-900 text-cyan-400 px-1.5 py-0.5 rounded font-mono">#password</code>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div id="remember-group" className={`p-2 rounded-lg border transition-all ${highlightTarget === 'remember-group' ? highlightStyle : 'border-transparent'}`}>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Remember Me</span>
                  <code className="text-[10px] bg-slate-900 text-cyan-400 px-1.5 py-0.5 rounded font-mono ml-auto">#remember</code>
                </label>
              </div>

              <button
                id="login-btn"
                onClick={() => {
                  setLoginMessage({ type: 'success', text: 'Login Successful! Welcome back.' });
                }}
                className={`w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition border ${highlightTarget === 'login-btn' ? highlightStyle : 'border-transparent'}`}
              >
                Login <code className="text-[10px] bg-indigo-900/60 px-1.5 py-0.5 rounded font-mono ml-2">#login-btn</code>
              </button>

              {loginMessage && (
                <div
                  id="login-message"
                  className={`p-3 rounded-lg text-xs flex items-center justify-between border transition-all ${loginMessage.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/40 text-rose-300 border-rose-500/40'} ${highlightTarget === 'login-message' ? highlightStyle : ''}`}
                >
                  <span>{loginMessage.text}</span>
                  <code className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded">#login-message</code>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-sm p-6 bg-slate-800/80 rounded-xl border border-slate-700/50 backdrop-blur shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center justify-between">
                <span>Dashboard</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">Logged In</span>
              </h3>
              <p className="text-sm text-slate-300">Welcome, <strong>{username || 'admin'}</strong>!</p>

              <div id="counter-area" className={`p-4 rounded-lg bg-slate-900 border transition-all ${highlightTarget === 'counter-area' ? highlightStyle : 'border-slate-800'}`}>
                <div className="text-xs font-semibold text-slate-300 flex justify-between mb-2">
                  <span>Interactive Counter</span>
                  <code className="text-[10px] text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded">.counter-area</code>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => setCounter(c => c - 1)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-lg font-bold text-slate-200">-</button>
                  <span id="counter-value" className="text-2xl font-extrabold font-mono text-indigo-400 min-w-[36px] text-center">{counter}</span>
                  <button onClick={() => setCounter(c => c + 1)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-lg font-bold text-slate-200">+</button>
                </div>
              </div>

              <button
                onClick={() => { setActiveScreen('login'); resetMockSite(); }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Test Runner Controls & Code Viewer */}
      <div className="flex flex-col bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>Test Logic Console</span>
          </h2>
          <select
            value={selectedSuite}
            onChange={e => { setSelectedSuite(e.target.value); setCurrentStep(0); resetMockSite(); }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 font-mono outline-none cursor-pointer focus:border-indigo-500"
          >
            <option value="loginSuccess">1. Success Login Test (Logical Path)</option>
            <option value="counterTest">2. Counter Increment/Decrement Test</option>
          </select>
        </div>

        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAll}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Entire Test</span>
            </button>
            <button
              onClick={handleRunNextStep}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded transition"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Step Line</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded transition border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Delay: {speed}ms</span>
            <input
              type="range"
              min="300"
              max="2000"
              step="100"
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="px-4 py-2.5 bg-rose-950/30 border-b border-slate-800 flex items-center justify-between text-xs text-rose-300">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={injectBug}
              onChange={e => setInjectBug(e.target.checked)}
              className="accent-rose-500 rounded"
            />
            <Bug className="w-4 h-4 text-rose-400" />
            <span>Inject Mock App Bug (Test failure assertions)</span>
          </label>
        </div>

        {/* Code Snippet Box */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 font-mono text-xs overflow-x-auto max-h-56">
          <div className="text-[10px] text-slate-500 mb-2 flex justify-between font-sans">
            <span>TEST CODE EXECUTION VIEW</span>
            <span>Step {currentStep} / {activeSteps.length}</span>
          </div>
          {activeSteps.map((stepObj, idx) => (
            <div
              key={idx}
              className={`p-2 rounded mb-1 border-l-2 transition-all ${idx === currentStep && isRunning ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200' : 'border-transparent text-slate-400'}`}
            >
              <pre className="whitespace-pre-wrap">{stepObj.code}</pre>
            </div>
          ))}
        </div>

        {/* Real-time Assertion Logs */}
        <div className="p-4 bg-slate-950/80 flex-grow flex flex-col min-h-[160px] font-mono text-xs">
          <div className="text-[10px] text-slate-500 mb-2 font-sans flex justify-between">
            <span>EXECUTION LOGS & ASSERTIONS</span>
            <button onClick={() => setLogs([])} className="hover:text-slate-300 transition">Clear Logs</button>
          </div>
          <div className="flex-grow space-y-1.5 overflow-y-auto max-h-40">
            {logs.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                {item.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                {item.type === 'error' && <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
                {item.type === 'action' && <span className="text-cyan-400 text-[10px] font-bold">⚡ [ACTION]</span>}
                {item.type === 'assert' && <span className="text-amber-400 text-[10px] font-bold">🔍 [ASSERT]</span>}
                <span className={item.type === 'error' ? 'text-rose-400 font-semibold' : item.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}>
                  {item.text}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
