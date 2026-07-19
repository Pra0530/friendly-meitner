// languageWorker.js - A micro LSP Server running in a Web Worker
self.onmessage = function (e) {
  const { method, params } = e.data;

  if (method === "initialize") {
    self.postMessage({
      method: "initialized",
      params: { capabilities: { hoverProvider: true, diagnosticsProvider: true } }
    });
    return;
  }

  if (method === "textDocument/didChange") {
    const { text, language } = params;
    const diagnostics = runSyntaxCheck(text, language);
    const symbols = analyzeSymbols(text, language);

    self.postMessage({
      method: "textDocument/publishDiagnostics",
      params: { diagnostics, symbols }
    });
  }
};

/**
 * Basic non-blocking syntax check for JavaScript and Python
 */
function runSyntaxCheck(text, language) {
  const diagnostics = [];
  const lines = text.split("\n");

  // Check brackets and parentheses balance
  const stack = [];
  const openToClose = { "{": "}", "[": "]", "(": ")" };
  const closeToOpen = { "}": "{", "]": "[", ")": "(" };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for JavaScript trailing commas or common mistakes
    if (language === "javascript" || language === "js") {
      if (line.includes("const ") && !line.includes("=") && !line.includes(";")) {
        // Simple heuristic for declaration without initializer
        if (!line.includes("for") && !line.includes("in") && !line.includes("of")) {
          diagnostics.push({
            line: i + 1,
            severity: "error",
            message: "const declarations must be initialized."
          });
        }
      }
    }

    // Check bracket mismatch per line
    for (let col = 0; col < line.length; col++) {
      const char = line[col];
      if (openToClose[char]) {
        stack.push({ char, line: i + 1, col: col + 1 });
      } else if (closeToOpen[char]) {
        if (stack.length === 0) {
          diagnostics.push({
            line: i + 1,
            severity: "error",
            message: `Unexpected closing character '${char}'`
          });
        } else {
          const last = stack.pop();
          if (last.char !== closeToOpen[char]) {
            diagnostics.push({
              line: i + 1,
              severity: "error",
              message: `Mismatched bracket: expected '${openToClose[last.char]}' but found '${char}'`
            });
          }
        }
      }
    }
  }

  // Any remaining open brackets
  while (stack.length > 0) {
    const last = stack.pop();
    diagnostics.push({
      line: last.line,
      severity: "warning",
      message: `Unclosed bracket '${last.char}'`
    });
  }

  return diagnostics;
}

/**
 * Pulls variables, functions, and key statements for autocomplete or outline
 */
function analyzeSymbols(text, language) {
  const symbols = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect function declarations
    let match = line.match(/(?:function|def)\s+([a-zA-Z0-9_]+)\s*\(/);
    if (match) {
      symbols.push({
        name: match[1],
        kind: "function",
        line: i + 1
      });
    }

    // Detect variable declarations
    match = line.match(/(?:let|const|var)\s+([a-zA-Z0-9_]+)\s*=/);
    if (match) {
      symbols.push({
        name: match[1],
        kind: "variable",
        line: i + 1
      });
    }
  }

  return symbols;
}
