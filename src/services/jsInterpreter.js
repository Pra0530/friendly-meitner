let babelLoaded = false;

const loadBabelScript = () => {
  return new Promise((resolve, reject) => {
    const isBrowser = typeof window !== 'undefined';
    if ((isBrowser && window.Babel) || globalThis.Babel || babelLoaded) return resolve();
    if (!isBrowser) return reject(new Error("Babel standalone can only be loaded in a browser environment."));
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.0/babel.min.js";
    script.onload = () => {
      babelLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

/**
 * Instruments JS code to inject __trace calls that log line numbers, action type, and current scope variables.
 * @param {string} code - The raw JavaScript code.
 * @param {string} customInput - Optional custom input string to execute.
 * @returns {Promise<string>} - The instrumented code.
 */
export const instrumentJS = async (code, customInput = null) => {
  await loadBabelScript();
  const Babel = typeof window !== 'undefined' ? window.Babel : globalThis.Babel;

  let mainFuncName = null;
  let hasCallAtBottom = false;

  const plugin = ({ types: t }) => {
    return {
      visitor: {
        FunctionDeclaration(path) {
          if (!mainFuncName) {
            mainFuncName = path.node.id.name;
          }
        },
        CallExpression(path) {
          let currentParent = path.parentPath;
          let isTopLevel = true;
          while (currentParent) {
            if (currentParent.isFunction()) {
              isTopLevel = false;
              break;
            }
            currentParent = currentParent.parentPath;
          }
          if (isTopLevel && mainFuncName && path.node.callee.name === mainFuncName) {
            hasCallAtBottom = true;
          }
        },
        Statement(path) {
          if (
            path.isBlockStatement() ||
            path.isFunctionDeclaration() ||
            path.isProgram() ||
            path.isImportDeclaration() ||
            path.isExportDeclaration()
          ) {
            return;
          }

          const line = path.node.loc ? path.node.loc.start.line : -1;
          if (line === -1) return;

          // Determine the action type
          let action = "assignment";
          if (path.isReturnStatement()) {
            action = "return";
          } else if (path.isIfStatement() || path.isSwitchStatement() || path.isSwitchCase()) {
            action = "condition";
          } else if (path.isLoop() || path.isForStatement() || path.isWhileStatement() || path.isDoWhileStatement() || path.isForInStatement() || path.isForOfStatement()) {
            action = "loop";
          } else if (path.isExpressionStatement() && path.node.expression.type === "CallExpression") {
            action = "call";
          }

          const bindings = [];
          let currentScope = path.scope;
          while (currentScope) {
            Object.keys(currentScope.bindings).forEach((name) => {
              if (!bindings.includes(name) && name !== '__trace' && name !== '__vars' && name !== '__trace_cond') {
                bindings.push(name);
              }
            });
            currentScope = currentScope.parent;
          }

          const body = [
            t.variableDeclaration('let', [
              t.variableDeclarator(t.identifier('__vars'), t.objectExpression([]))
            ])
          ];

          bindings.forEach((name) => {
            body.push(
              t.tryStatement(
                t.blockStatement([
                  t.expressionStatement(
                    t.assignmentExpression(
                      '=',
                      t.memberExpression(t.identifier('__vars'), t.identifier(name)),
                      t.identifier(name)
                    )
                  )
                ]),
                t.catchClause(t.identifier('e'), t.blockStatement([]))
              )
            );
          });

          body.push(
            t.expressionStatement(
              t.callExpression(t.identifier('__trace'), [
                t.numericLiteral(line),
                t.stringLiteral(action),
                t.identifier('__vars')
              ])
            )
          );

          const iife = t.expressionStatement(
            t.callExpression(
              t.functionExpression(null, [], t.blockStatement(body)),
              []
            )
          );

          path.insertBefore(iife);
        },
        Conditional(path) {
          const line = path.node.loc ? path.node.loc.start.line : -1;
          if (line === -1) return;

          if (path.node.test && (path.node.test.type !== 'CallExpression' || (path.node.test.callee && path.node.test.callee.name !== '__trace_cond'))) {
            const bindings = [];
            let currentScope = path.scope;
            while (currentScope) {
              Object.keys(currentScope.bindings).forEach((name) => {
                if (!bindings.includes(name) && name !== '__trace' && name !== '__vars' && name !== '__trace_cond') {
                  bindings.push(name);
                }
              });
              currentScope = currentScope.parent;
            }

            const iifeBody = [
              t.variableDeclaration('let', [
                t.variableDeclarator(t.identifier('__vars'), t.objectExpression([]))
              ])
            ];

            bindings.forEach((name) => {
              iifeBody.push(
                t.tryStatement(
                  t.blockStatement([
                    t.expressionStatement(
                      t.assignmentExpression(
                        '=',
                        t.memberExpression(t.identifier('__vars'), t.identifier(name)),
                        t.identifier(name)
                      )
                    )
                  ]),
                  t.catchClause(t.identifier('e'), t.blockStatement([]))
                )
              );
            });

            iifeBody.push(t.returnStatement(t.identifier('__vars')));

            const varsExpression = t.callExpression(
              t.functionExpression(null, [], t.blockStatement(iifeBody)),
              []
            );

            let action = "condition";
            if (path.parentPath && (path.parentPath.isWhileStatement() || path.parentPath.isForStatement() || path.parentPath.isDoWhileStatement())) {
              action = "loop";
            }

            path.node.test = t.callExpression(t.identifier('__trace_cond'), [
              t.numericLiteral(line),
              t.stringLiteral(action),
              path.node.test,
              varsExpression
            ]);
          }
        }
      }
    };
  };

  const result = Babel.transform(code, {
    plugins: [plugin],
    retainLines: true,
  });

  let instrumented = result.code;

  if (customInput && mainFuncName) {
    instrumented += `\n;${mainFuncName}(${customInput});`;
  } else if (!hasCallAtBottom && mainFuncName) {
    instrumented += `\n;${mainFuncName}();`;
  }

  return instrumented;
};

export const runJSSandbox = (instrumentedCode) => {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const trace = [];
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("JavaScript execution timed out (potential infinite loop)."));
    }, 3000);

    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener('message', handleMessage);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    let initial_data = null;

    const handleMessage = (event) => {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (data.type === 'trace') {
        trace.push(data.step);
      } else if (data.type === 'done') {
        initial_data = data.initial_data;
        cleanup();
        resolve({ trace, initial_data });
      } else if (data.type === 'error') {
        cleanup();
        reject(new Error(data.message));
      }
    };

    window.addEventListener('message', handleMessage);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <script>
          const __trace_list = [];
          const __node_ids = new Map();
          let __node_counter = 1;
          const __all_nodes = [];
          
          function __get_node_id(obj) {
            if (!obj || typeof obj !== 'object') return null;
            if (!__node_ids.has(obj)) {
              const id = "node_" + (__node_counter++);
              __node_ids.set(obj, id);
              if (!Array.isArray(obj)) {
                if ('val' in obj || 'value' in obj || 'left' in obj || 'right' in obj || 'next' in obj || 'neighbors' in obj) {
                  __all_nodes.push(obj);
                }
              }
            }
            return __node_ids.get(obj);
          }

          function __serialize_val(val) {
            if (val === null || val === undefined) return val;
            if (typeof val === 'function') return undefined;
            if (val === window || val === document) return undefined;
            if (typeof val === 'object') {
              if (Array.isArray(val)) {
                return val.map(__serialize_val);
              }
              if ('val' in val || 'value' in val || 'left' in val || 'right' in val || 'next' in val || 'neighbors' in val) {
                return __get_node_id(val);
              }
              const clean = {};
              for (const [k, v] of Object.entries(val)) {
                clean[k] = __serialize_val(v);
              }
              return clean;
            }
            return val;
          }

          function __trace(line, action, vars) {
            const cleanVars = {};
            for (const [k, v] of Object.entries(vars)) {
              cleanVars[k] = __serialize_val(v);
            }
            
            const step = {
              step: __trace_list.length,
              line: line,
              action: action,
              variables: cleanVars
            };
            __trace_list.push(step);
            
            if (__trace_list.length > 500) {
              window.parent.postMessage({ type: 'error', message: 'Trace exceeded limit of 500 steps. Infinite loop?' }, '*');
              throw new Error('Trace limit exceeded');
            }
            
            window.parent.postMessage({ type: 'trace', step }, '*');
          }
          
          function __trace_cond(line, action, cond, vars) {
            __trace(line, action, vars);
            return cond;
          }

          window.onerror = function(msg, url, line, col, error) {
            window.parent.postMessage({ type: 'error', message: msg }, '*');
            return true;
          };

          try {
            // Block all network and dynamic code execution capabilities
            const fetch = undefined;
            const XMLHttpRequest = undefined;
            const WebSocket = undefined;
            const localStorage = undefined;
            const sessionStorage = undefined;
            const eval = undefined;
            const Function = undefined;

            ${instrumentedCode}
            
            const flatNodes = __all_nodes.map(node => {
              return {
                id: __get_node_id(node),
                val: node.val !== undefined ? node.val : node.value,
                left: __get_node_id(node.left),
                right: __get_node_id(node.right),
                next: __get_node_id(node.next),
                neighbors: Array.isArray(node.neighbors) ? node.neighbors.map(__get_node_id) : undefined
              };
            });

            window.parent.postMessage({ type: 'done', initial_data: flatNodes }, '*');
          } catch (err) {
            window.parent.postMessage({ type: 'error', message: err.message }, '*');
          }
        </script>
      </body>
      </html>
    `;

    iframe.srcdoc = html;
  });
};
