import React, { useState, useRef, useEffect } from 'react';
import { Terminal, CornerDownLeft } from 'lucide-react';
import { pluginManager } from '../services/pluginManager';

const TerminalEmulator = ({ code, onPlay, lspDiagnostics = [] }) => {
  const [history, setHistory] = useState([
    { text: "Welcome to CodeMaster IDE Terminal v1.0.0", type: "system" },
    { text: "Type 'help' to view all registered utility commands.", type: "system" }
  ]);
  const [inputVal, setInputVal] = useState("");
  const terminalEndRef = useRef(null);

  const executeCommand = (cmdStr) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    const parts = trimmed.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newLogs = [...history, { text: `codemaster$ ${trimmed}`, type: "command" }];

    switch (command) {
      case "help":
        newLogs.push(
          { text: "Available Commands:", type: "info" },
          { text: "  help          - Display command usage list.", type: "text" },
          { text: "  clear         - Clear terminal screen.", type: "text" },
          { text: "  run           - Execute and visual-trace active source code.", type: "text" },
          { text: "  git status    - Display workspace repository staging details.", type: "text" },
          { text: "  lsp           - Check Language Server Protocol details & lint errors.", type: "text" },
          { text: "  theme [name]  - Toggle editor color system theme (standard, dark, neon).", type: "text" },
          { text: "  plugins       - List loaded process sandboxes.", type: "text" }
        );
        break;

      case "clear":
        setHistory([]);
        return;

      case "run":
        newLogs.push({ text: "Compiling execution trace inside background sandbox...", type: "info" });
        onPlay(code);
        break;

      case "git":
        if (args[0] === "status") {
          newLogs.push(
            { text: "On branch main", type: "text" },
            { text: "Your branch is up to date with 'origin/main'.", type: "text" },
            { text: "\nChanges not staged for commit:", type: "text" },
            { text: "  (use \"git add <file>...\" to update what will be committed)", type: "text" },
            { text: "    modified:   src/components/CodeEditor.jsx (LSP / Virtualization upgrades)", type: "warning" },
            { text: "    modified:   src/components/Visualizer.jsx (Pointers mapping fixes)", type: "warning" },
            { text: "\nno changes added to commit (use \"git add\" and/or \"git commit -a\")", type: "text" }
          );
        } else {
          newLogs.push({ text: `git: unknown sub-command '${args.join(" ")}'. Try 'git status'.`, type: "error" });
        }
        break;

      case "lsp":
        newLogs.push(
          { text: "Language Server Protocol Status:", type: "info" },
          { text: "  Server status: CONNECTED (running in background Web Worker)", type: "text" },
          { text: `  Active Lint Diagnostics: ${lspDiagnostics.length} error(s) found`, type: "text" }
        );
        if (lspDiagnostics.length > 0) {
          lspDiagnostics.forEach(diag => {
            newLogs.push({ text: `  - [Error Line ${diag.line}] ${diag.message}`, type: "error" });
          });
        }
        break;

      case "theme":
        const themeName = args[0];
        if (!themeName) {
          newLogs.push(
            { text: "Available themes: 'standard', 'dark', 'neon'.", type: "info" },
            { text: "Usage: theme neon", type: "text" }
          );
        } else if (["standard", "dark", "neon"].includes(themeName.toLowerCase())) {
          applyTheme(themeName.toLowerCase());
          newLogs.push({ text: `Theme successfully applied: ${themeName}`, type: "success" });
          // Notify plugins about theme change
          pluginManager.triggerEvent("onThemeChange", { theme: themeName });
        } else {
          newLogs.push({ text: `Theme '${themeName}' not recognized.`, type: "error" });
        }
        break;

      case "plugins":
        newLogs.push(
          { text: "Sandboxed Extension Manager:", type: "info" },
          { text: `  Process: public/extensionWorker.js (Active)`, type: "text" },
          { text: `  Plugin 1: theme-logger-plugin (status: active)`, type: "success" },
          { text: `  Plugin 2: diagnostics-sync-plugin (status: active)`, type: "success" }
        );
        break;

      default:
        newLogs.push({ text: `command not found: ${command}. Try typing 'help'.`, type: "error" });
    }

    setHistory(newLogs);
    setInputVal("");
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === "neon") {
      root.style.setProperty("--accent-color", "#00ffcc");
      root.style.setProperty("--bg-base", "#050b14");
      root.style.setProperty("--bg-surface", "#0b1528");
      root.style.setProperty("--border-glass", "rgba(0, 255, 204, 0.15)");
      root.style.setProperty("--accent-glow", "rgba(0, 255, 204, 0.4)");
    } else if (theme === "dark") {
      root.style.setProperty("--accent-color", "#8b5cf6");
      root.style.setProperty("--bg-base", "#03000a");
      root.style.setProperty("--bg-surface", "#0d0b18");
      root.style.setProperty("--border-glass", "rgba(139, 92, 246, 0.12)");
      root.style.setProperty("--accent-glow", "rgba(139, 92, 246, 0.4)");
    } else {
      // standard blue theme
      root.style.setProperty("--accent-color", "#3b82f6");
      root.style.setProperty("--bg-base", "#050505");
      root.style.setProperty("--bg-surface", "#111111");
      root.style.setProperty("--border-glass", "rgba(255, 255, 255, 0.08)");
      root.style.setProperty("--accent-glow", "rgba(59, 130, 246, 0.4)");
    }
  };

  // Scroll to bottom when output updates
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      executeCommand(inputVal);
    }
  };

  return (
    <div style={{
      background: 'rgba(5, 5, 5, 0.9)',
      border: '1px solid var(--border-glass)',
      borderRadius: '12px',
      height: '180px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
    }}>
      {/* Header bar */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-secondary)'
      }}>
        <Terminal size={14} color="var(--accent-color)" />
        <span style={{ fontWeight: '500' }}>bash - built-in terminal emulator</span>
      </div>

      {/* Terminal Logs */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {history.map((log, index) => {
          let color = 'var(--text-primary)';
          if (log.type === "system") color = 'var(--text-secondary)';
          else if (log.type === "info") color = 'var(--accent-color)';
          else if (log.type === "error") color = 'var(--danger-color)';
          else if (log.type === "warning") color = 'var(--warning-color)';
          else if (log.type === "success") color = 'var(--success-color)';
          else if (log.type === "command") color = '#e2e8f0';

          return (
            <div key={index} style={{ color, whiteSpace: 'pre-wrap' }}>
              {log.text}
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        borderTop: '1px solid var(--border-glass)',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(0,0,0,0.4)'
      }}>
        <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>codemaster$</span>
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px'
          }}
          placeholder="Type a command..."
        />
        <CornerDownLeft size={12} color="var(--text-muted)" />
      </div>
    </div>
  );
};

export default TerminalEmulator;
