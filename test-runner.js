/**
 * Web Testing Logic Playground - Test Runner Engine
 * Emulates modern web automation testing frameworks (Playwright, Selenium) 
 * using standard client-side JavaScript.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Playground Controls
  const testSelect = document.getElementById('test-select');
  const btnRun = document.getElementById('btn-run');
  const btnStep = document.getElementById('btn-step');
  const btnReset = document.getElementById('btn-reset');
  const speedSlider = document.getElementById('speed-slider');
  const speedVal = document.getElementById('speed-val');
  const toggleInjectBug = document.getElementById('toggle-inject-bug');
  const codeDisplay = document.getElementById('code-display');
  const consoleLogs = document.getElementById('console-logs');
  const btnClearLogs = document.getElementById('btn-clear-logs');
  const stepIndicator = document.getElementById('step-indicator');
  
  // DOM Elements - Mock Website
  const mockPageContent = document.getElementById('mock-page-content');
  const screenLogin = document.getElementById('screen-login');
  const screenDashboard = document.getElementById('screen-dashboard');
  const browserUrl = document.getElementById('browser-url');
  
  const inputUsername = document.getElementById('username');
  const inputPassword = document.getElementById('password');
  const checkboxRemember = document.getElementById('remember');
  const btnLogin = document.getElementById('login-btn');
  const loginMessage = document.getElementById('login-message');
  const messageText = document.getElementById('message-text');
  
  const userDisplay = document.getElementById('user-display');
  const counterValue = document.getElementById('counter-value');
  const btnDecrement = document.getElementById('counter-decrement');
  const btnIncrement = document.getElementById('counter-increment');
  const themeStatus = document.getElementById('theme-status');
  const btnThemeToggle = document.getElementById('theme-toggle');
  const btnLogout = document.getElementById('logout-btn');

  // App variables
  let currentStep = 0;
  let activeSuite = null;
  let isRunning = false;
  let runTimeout = null;
  let counter = 0;

  // Mock Website Behavior Setup
  btnIncrement.addEventListener('click', () => {
    counter++;
    counterValue.innerText = counter;
  });

  btnDecrement.addEventListener('click', () => {
    counter--;
    counterValue.innerText = counter;
  });

  btnThemeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    themeStatus.innerText = isDark ? 'Dark Mode' : 'Light Mode';
    themeStatus.className = isDark ? 'dark-mode-status' : '';
  });

  btnLogout.addEventListener('click', () => {
    screenDashboard.classList.remove('active');
    screenLogin.classList.add('active');
    browserUrl.innerText = 'https://mysandboxapp.com/login';
    resetMockSiteInputs();
  });

  // Helper: Reset mock page input states
  function resetMockSiteInputs() {
    inputUsername.value = '';
    inputPassword.value = '';
    checkboxRemember.checked = false;
    loginMessage.classList.add('hide');
    loginMessage.className = 'message-box hide';
    messageText.innerText = '';
    counter = 0;
    counterValue.innerText = '0';
    document.body.classList.remove('dark-theme');
    themeStatus.innerText = 'Light Mode';
    themeStatus.className = '';
    
    // Remove all highlights
    document.querySelectorAll('.highlight-select, .highlight-action, .highlight-assert-success, .highlight-assert-fail')
      .forEach(el => el.classList.remove('highlight-select', 'highlight-action', 'highlight-assert-success', 'highlight-assert-fail'));
  }

  // Speed Slider Listener
  speedSlider.addEventListener('input', (e) => {
    speedVal.innerText = e.target.value;
  });

  // Clear Console Logs
  btnClearLogs.addEventListener('click', () => {
    consoleLogs.innerHTML = '<div class="log-line info">Logs cleared.</div>';
  });

  // Log to Simulator Console
  function log(type, text) {
    const logLine = document.createElement('div');
    logLine.className = `log-line ${type}`;
    
    let prefix = 'ℹ️ [INFO]';
    if (type === 'action') prefix = '⚡ [ACTION]';
    if (type === 'assert') prefix = '🔍 [ASSERT]';
    if (type === 'success') prefix = '✅ [PASS]';
    if (type === 'error') prefix = '❌ [FAIL]';

    logLine.innerHTML = `<span>${prefix} ${text}</span>`;
    consoleLogs.appendChild(logLine);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
  }

  // Highlight helper for visual code simulation
  function applyHighlight(element, className) {
    if (!element) return;
    // Clear previous highlighting classes
    element.classList.remove('highlight-select', 'highlight-action', 'highlight-assert-success', 'highlight-assert-fail');
    // Force reflow
    void element.offsetWidth;
    element.classList.add(className);
  }

  // Test Suite Definitions
  // Each step contains:
  // - code: The text of the code statement to display.
  // - action: A function that runs the assertion / automation code. Returns true if step passes, false if failed.
  const suites = {
    loginSuccess: [
      {
        code: "// Step 1: Open website URL\nawait page.goto('https://mysandboxapp.com/login');",
        action: () => {
          browserUrl.innerText = 'https://mysandboxapp.com/login';
          log('action', "page.goto('https://mysandboxapp.com/login')");
          return true;
        }
      },
      {
        code: "// Step 2: Target username input and type credentials\nconst usernameEl = await page.locator('#username');\nawait usernameEl.fill('admin');",
        action: () => {
          let selector = '#username';
          
          // Bug Injection: Misspell target selector to test logic failure
          if (toggleInjectBug.checked) {
            selector = '#user-name-typo';
            log('info', "BUG INJECTED: Searching for wrong selector ID: '#user-name-typo'");
          }

          const target = document.querySelector(selector);
          if (!target) {
            log('error', `Element with selector "${selector}" not found on page!`);
            applyHighlight(inputUsername, 'highlight-assert-fail');
            return false;
          }

          applyHighlight(target, 'highlight-action');
          target.value = 'admin';
          log('action', `Filled username field with "admin"`);
          return true;
        }
      },
      {
        code: "// Step 3: Target password input and fill values\nconst passwordEl = await page.locator('#password');\nawait passwordEl.fill('password123');",
        action: () => {
          const target = document.querySelector('#password');
          applyHighlight(target, 'highlight-action');
          
          // Bug Injection: Input is disabled, preventing automation typing
          if (toggleInjectBug.checked) {
            target.disabled = true;
            log('info', "BUG INJECTED: Password input field is disabled.");
          } else {
            target.disabled = false;
          }

          if (target.disabled) {
            log('error', `Cannot type password. Field is disabled!`);
            applyHighlight(target, 'highlight-assert-fail');
            return false;
          }

          target.value = 'password123';
          log('action', `Filled password field with "•••••••••••"`);
          return true;
        }
      },
      {
        code: "// Step 4: Toggle the remember me checkbox\nawait page.locator('#remember').check();",
        action: () => {
          const target = document.querySelector('#remember');
          applyHighlight(target, 'highlight-action');
          target.checked = true;
          log('action', `Checked the 'Remember Me' checkbox`);
          return true;
        }
      },
      {
        code: "// Step 5: Click on the login submit button\nawait page.locator('#login-btn').click();",
        action: () => {
          const target = document.querySelector('#login-btn');
          applyHighlight(target, 'highlight-action');
          
          // Execute mock website action
          if (inputUsername.value === 'admin' && inputPassword.value === 'password123') {
            loginMessage.className = 'message-box success';
            messageText.innerText = 'Login Successful! Welcome back.';
          } else {
            loginMessage.className = 'message-box error';
            messageText.innerText = 'Error: Invalid credentials.';
          }
          loginMessage.classList.remove('hide');

          log('action', `Clicked on '#login-btn'`);
          return true;
        }
      },
      {
        code: "// Step 6: Validate success message is visible and matches text\nconst message = await page.locator('#login-message').innerText();\nexpect(message).toContain('Login Successful');",
        action: () => {
          const target = document.querySelector('#login-message');
          const text = messageText.innerText;
          
          log('assert', `expect('#login-message').toContain('Login Successful')`);
          
          let containsSuccess = text.includes('Login Successful');
          if (toggleInjectBug.checked) {
            // Bug Injection: App returns incorrect success wording, breaking assertions
            messageText.innerText = 'Operation Finished.';
            containsSuccess = false;
            log('info', "BUG INJECTED: Success message text changed to 'Operation Finished.'");
          }

          if (containsSuccess) {
            applyHighlight(target, 'highlight-assert-success');
            log('success', `Assertion Passed! Text contains "Login Successful"`);
            return true;
          } else {
            applyHighlight(target, 'highlight-assert-fail');
            log('error', `Assertion Failed! Found: "${text}", expected to contain "Login Successful"`);
            return false;
          }
        }
      },
      {
        code: "// Step 7: Confirm routing redirection is correct\nawait expect(page).toHaveURL(/dashboard/);",
        action: () => {
          browserUrl.innerText = 'https://mysandboxapp.com/dashboard';
          screenLogin.classList.remove('active');
          screenDashboard.classList.add('active');
          userDisplay.innerText = inputUsername.value;
          log('assert', `expect(URL).toMatch(/dashboard/)`);
          log('success', `Navigation Redirection test successful!`);
          return true;
        }
      }
    ],
    
    loginFail: [
      {
        code: "// Step 1: Open website URL\nawait page.goto('https://mysandboxapp.com/login');",
        action: () => {
          browserUrl.innerText = 'https://mysandboxapp.com/login';
          log('action', "page.goto('https://mysandboxapp.com/login')");
          return true;
        }
      },
      {
        code: "// Step 2: Fill invalid username\nawait page.locator('#username').fill('bad_user');",
        action: () => {
          const target = document.querySelector('#username');
          applyHighlight(target, 'highlight-action');
          target.value = 'bad_user';
          log('action', `Filled username field with "bad_user"`);
          return true;
        }
      },
      {
        code: "// Step 3: Fill invalid password\nawait page.locator('#password').fill('wrongpass');",
        action: () => {
          const target = document.querySelector('#password');
          applyHighlight(target, 'highlight-action');
          target.value = 'wrongpass';
          log('action', `Filled password field with "wrongpass"`);
          return true;
        }
      },
      {
        code: "// Step 4: Click the submit button\nawait page.locator('#login-btn').click();",
        action: () => {
          const target = document.querySelector('#login-btn');
          applyHighlight(target, 'highlight-action');
          
          loginMessage.className = 'message-box error';
          messageText.innerText = 'Error: Invalid credentials.';
          loginMessage.classList.remove('hide');

          log('action', `Clicked on '#login-btn'`);
          return true;
        }
      },
      {
        code: "// Step 5: Assert error warning box is displayed\nconst errorBox = page.locator('#login-message');\nawait expect(errorBox).toBeVisible();\nawait expect(errorBox).toHaveClass(/error/);",
        action: () => {
          const target = document.querySelector('#login-message');
          log('assert', `expect('#login-message').toBeVisible()`);
          log('assert', `expect('#login-message').toHaveClass(/error/)`);
          
          const isVisible = !target.classList.contains('hide');
          const isError = target.classList.contains('error');

          if (isVisible && isError) {
            applyHighlight(target, 'highlight-assert-success');
            log('success', `Assertion Passed: Error container is visible and has CSS class 'error'`);
            return true;
          } else {
            applyHighlight(target, 'highlight-assert-fail');
            log('error', `Assertion Failed: Expected error box to be visible with class 'error'`);
            return false;
          }
        }
      }
    ],

    counterTest: [
      {
        code: "// Step 1: Redirection helper to ensure logged-in dashboard view\nawait page.goto('https://mysandboxapp.com/dashboard');",
        action: () => {
          browserUrl.innerText = 'https://mysandboxapp.com/dashboard';
          screenLogin.classList.remove('active');
          screenDashboard.classList.add('active');
          log('action', `Navigated to dashboard dashboard`);
          return true;
        }
      },
      {
        code: "// Step 2: Grab the counter element and verify starting point is 0\nconst counterVal = await page.locator('#counter-value').innerText();\nexpect(parseInt(counterVal)).toBe(0);",
        action: () => {
          const target = document.getElementById('counter-value');
          log('assert', `expect(counterValue).toBe(0)`);
          
          const val = parseInt(target.innerText);
          if (val === 0) {
            applyHighlight(target, 'highlight-assert-success');
            log('success', `Assertion Passed: Initial counter value is 0`);
            return true;
          } else {
            applyHighlight(target, 'highlight-assert-fail');
            log('error', `Assertion Failed: Counter starting value expected 0, but found ${val}`);
            return false;
          }
        }
      },
      {
        code: "// Step 3: Run loop automation to click the '+' button 3 times\nconst btnInc = page.locator('#counter-increment');\nfor (let i = 0; i < 3; i++) {\n  await btnInc.click();\n}",
        action: () => {
          const target = document.getElementById('counter-increment');
          applyHighlight(target, 'highlight-action');
          
          let clickCount = 3;
          if (toggleInjectBug.checked) {
            // Bug Injection: Simulate mechanical click failure where click only increments once
            clickCount = 1;
            log('info', "BUG INJECTED: Simulator click registered minor button failure (only clicked once).");
          }

          for(let i = 0; i < clickCount; i++) {
            btnIncrement.click();
          }
          log('action', `Simulated clicking '#'counter-increment' button 3 times`);
          return true;
        }
      },
      {
        code: "// Step 4: Assert new counter state matches arithmetic logic (0 + 3 = 3)\nconst updatedVal = await page.locator('#counter-value').innerText();\nexpect(parseInt(updatedVal)).toBe(3);",
        action: () => {
          const target = document.getElementById('counter-value');
          log('assert', `expect(counterValue).toBe(3)`);
          const val = parseInt(target.innerText);
          
          if (val === 3) {
            applyHighlight(target, 'highlight-assert-success');
            log('success', `Assertion Passed: Counter incremented correctly to 3`);
            return true;
          } else {
            applyHighlight(target, 'highlight-assert-fail');
            log('error', `Assertion Failed: Expected counter value 3, but found ${val}`);
            return false;
          }
        }
      }
    ],

    themeToggle: [
      {
        code: "// Step 1: Open website dashboard\nawait page.goto('https://mysandboxapp.com/dashboard');",
        action: () => {
          browserUrl.innerText = 'https://mysandboxapp.com/dashboard';
          screenLogin.classList.remove('active');
          screenDashboard.classList.add('active');
          log('action', `Navigated to dashboard`);
          return true;
        }
      },
      {
        code: "// Step 2: Assert light mode class parameters are configured initially\nconst isDark = await page.evaluate(() => \n  document.body.classList.contains('dark-theme')\n);\nexpect(isDark).toBe(false);",
        action: () => {
          log('assert', `expect(body).not.toHaveClass('dark-theme')`);
          const isDark = document.body.classList.contains('dark-theme');
          
          if (!isDark) {
            log('success', `Assertion Passed: Body starts in Light Mode (does not contain 'dark-theme')`);
            return true;
          } else {
            log('error', `Assertion Failed: Body unexpectedly loaded in Dark Mode already.`);
            return false;
          }
        }
      },
      {
        code: "// Step 3: Trigger theme switcher click toggle\nawait page.locator('#theme-toggle').click();",
        action: () => {
          const target = document.getElementById('theme-toggle');
          applyHighlight(target, 'highlight-action');
          
          // Normal Click Toggle
          if (toggleInjectBug.checked) {
            // Bug Injection: Toggle button is broken and doesn't change classes
            log('info', "BUG INJECTED: Theme toggle handler button click does not propagate state.");
          } else {
            btnThemeToggle.click();
          }
          log('action', `Clicked on '#theme-toggle'`);
          return true;
        }
      },
      {
        code: "// Step 4: Verify dark mode activated in CSS styles and status wording\nconst themeLabel = await page.locator('#theme-status').innerText();\nexpect(themeLabel).toBe('Dark Mode');\nexpect(document.body.className).toContain('dark-theme');",
        action: () => {
          const status = document.getElementById('theme-status');
          const isDark = document.body.classList.contains('dark-theme');
          
          log('assert', `expect('#theme-status').toHaveText('Dark Mode')`);
          log('assert', `expect(body).toHaveClass('dark-theme')`);

          if (isDark && status.innerText === 'Dark Mode') {
            applyHighlight(status, 'highlight-assert-success');
            log('success', `Assertion Passed: Dashboard dark mode themes applied!`);
            return true;
          } else {
            applyHighlight(status, 'highlight-assert-fail');
            log('error', `Assertion Failed: Dark theme class or "Dark Mode" labels were not found!`);
            return false;
          }
        }
      }
    ]
  };

  // Render Suite Code Snippets in Visual Box
  function loadSuite(suiteKey) {
    // Cancel running test
    stopTest();

    activeSuite = suites[suiteKey];
    currentStep = 0;
    
    resetMockSiteInputs();
    updateCodeViewer();
    updateStepIndicator();
    
    log('info', `Loaded Suite: "${testSelect.options[testSelect.selectedIndex].text}"`);
  }

  // Update visual code lines block
  function updateCodeViewer() {
    if (!activeSuite) return;
    
    codeDisplay.innerHTML = '';
    activeSuite.forEach((step, index) => {
      const lineSpan = document.createElement('span');
      lineSpan.className = 'code-line';
      if (index === currentStep && isRunning) {
        lineSpan.className = 'code-line active';
      }
      
      // Escape HTML in code snippet
      const escapedCode = step.code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
      lineSpan.innerHTML = escapedCode;
      codeDisplay.appendChild(lineSpan);
    });
  }

  function updateStepIndicator() {
    if (!activeSuite) {
      stepIndicator.innerText = `Step 0 / 0`;
      return;
    }
    stepIndicator.innerText = `Step ${currentStep} / ${activeSuite.length}`;
  }

  // Core execution handler for stepping
  function executeCurrentStep() {
    if (!activeSuite || currentStep >= activeSuite.length) {
      stopTest();
      log('success', "Test suite execution completed successfully!");
      return;
    }

    updateCodeViewer();
    updateStepIndicator();
    
    const step = activeSuite[currentStep];
    const success = step.action();

    if (!success) {
      stopTest();
      log('error', `Test runner stopped due to validation failure at step ${currentStep + 1}.`);
      return;
    }

    currentStep++;
  }

  // Run suite line-by-line automatically
  function startTest() {
    if (isRunning) return;
    
    if (currentStep >= activeSuite.length) {
      currentStep = 0;
      resetMockSiteInputs();
    }
    
    isRunning = true;
    btnRun.innerText = '⏸ Pause Test';
    btnStep.disabled = true;
    
    runNextStepLoop();
  }

  function runNextStepLoop() {
    if (!isRunning) return;

    if (currentStep < activeSuite.length) {
      executeCurrentStep();
      const delay = parseInt(speedSlider.value);
      runTimeout = setTimeout(runNextStepLoop, delay);
    } else {
      executeCurrentStep(); // Trigger finish log
    }
  }

  function stopTest() {
    isRunning = false;
    btnRun.innerText = '▶ Run Entire Test';
    btnStep.disabled = false;
    if (runTimeout) {
      clearTimeout(runTimeout);
      runTimeout = null;
    }
    updateCodeViewer();
  }

  // Event Listeners
  testSelect.addEventListener('change', (e) => {
    loadSuite(e.target.value);
  });

  btnRun.addEventListener('click', () => {
    if (isRunning) {
      stopTest();
    } else {
      startTest();
    }
  });

  btnStep.addEventListener('click', () => {
    if (currentStep >= activeSuite.length) {
      currentStep = 0;
      resetMockSiteInputs();
    }
    executeCurrentStep();
  });

  btnReset.addEventListener('click', () => {
    stopTest();
    currentStep = 0;
    resetMockSiteInputs();
    updateCodeViewer();
    updateStepIndicator();
    log('info', 'Playground environments and DOM nodes reset.');
  });

  // Initialization: Load first suite
  loadSuite('loginSuccess');
});
