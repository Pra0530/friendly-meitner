let pyodideInstance = null;

const loadPyodideScript = () => {
  return new Promise((resolve, reject) => {
    if (window.loadPyodide) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const runPythonSandbox = async (code, customInput = null) => {
  await loadPyodideScript();
  if (!pyodideInstance) {
    pyodideInstance = await window.loadPyodide();
  }

  // Detect main function name
  const defMatch = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
  const mainFuncName = defMatch ? defMatch[1] : null;

  // Check if the function is already invoked in the code
  const isInvoked = mainFuncName
    ? new RegExp(`\\b${mainFuncName}\\s*\\(`).test(code.split('\n').slice(1).join('\n'))
    : false;

  let executionCode = code;
  if (customInput && mainFuncName) {
    executionCode += `\n\nprint(${mainFuncName}(${customInput}))`;
  } else if (!isInvoked && mainFuncName) {
    executionCode += `\n\nprint(${mainFuncName}())`;
  }

  // Escape for embedding in triple-quoted Python string
  const escapedCode = executionCode
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  const runnerScript = `
import sys
import json

# ── Internal names to ALWAYS strip from user variables ──────────────
INTERNAL_NAMES = {
  'trace_steps', 'tracer', 'sys', 'json',
  'object_ids', 'all_nodes', 'get_object_id',
  'serialize_val', 'user_code_lines', 'user_code',
  'blocked_modules', '_pyodide_core', 'builtins',
  'INTERNAL_NAMES', 'flat_nodes', 'result',
  '__name__', '__doc__', '__package__', '__loader__',
  '__spec__', '__builtins__', '__file__', '__cached__',
  'mod'
}

trace_steps = []
object_ids = {}
all_nodes = []

def get_object_id(obj):
    if obj is None:
        return None
    obj_id = id(obj)
    if obj_id not in object_ids:
        is_node_obj = False
        if not isinstance(obj, (int, float, str, bool, list, dict, set, tuple)):
            if hasattr(obj, 'val') or hasattr(obj, 'value') or hasattr(obj, 'left') or hasattr(obj, 'right') or hasattr(obj, 'next') or hasattr(obj, 'neighbors'):
                is_node_obj = True
        if is_node_obj:
            node_id = f"node_{len(object_ids) + 1}"
            object_ids[obj_id] = node_id
            all_nodes.append(obj)
        else:
            return obj
    return object_ids.get(obj_id)

def serialize_val(val):
    if val is None:
        return None
    if isinstance(val, (int, float, str, bool)):
        return val
    if isinstance(val, list):
        return [serialize_val(x) for x in val]
    if isinstance(val, dict):
        return {k: serialize_val(v) for k, v in val.items()}
    node_id = get_object_id(val)
    if node_id and isinstance(node_id, str) and node_id.startswith("node_"):
        return node_id
    try:
        json.dumps(val)
        return val
    except Exception:
        return str(val)

user_code = """${escapedCode}"""
user_code_lines = user_code.split('\\n')

def tracer(frame, event, arg):
    if event == 'line':
        line = frame.f_lineno
        variables = {}
        for k, v in frame.f_locals.items():
            # ── Skip all internal / pyodide names ──
            if k in INTERNAL_NAMES:
                continue
            if k.startswith('__'):
                continue
            # Skip module objects (pyodide internals leak as modules)
            if str(type(v)) == "<class 'module'>":
                continue
            # Skip callables that are not user-defined lambdas
            if callable(v) and not (hasattr(v, '__name__') and not v.__name__.startswith('<')):
                continue
            try:
                variables[k] = serialize_val(v)
            except Exception:
                pass

        depth = 0
        f = frame
        while f:
            depth += 1
            f = f.f_back

        line_idx = line - 1
        line_str = user_code_lines[line_idx].strip() if 0 <= line_idx < len(user_code_lines) else ""

        action = "assignment"
        if line_str.startswith(("if ", "elif ", "else:")):
            action = "condition"
        elif line_str.startswith(("while ", "for ")):
            action = "loop"
        elif line_str.startswith("return"):
            action = "return"
        elif "(" in line_str and ")" in line_str and "=" not in line_str:
            action = "call"

        trace_steps.append({
            "step": len(trace_steps),
            "line": line,
            "line_text": line_str,
            "action": action,
            "variables": variables,
            "depth": depth
        })
    return tracer

sys.settrace(tracer)
try:
    exec(user_code, {})
except Exception as e:
    trace_steps.append({
        "step": len(trace_steps),
        "line": -1,
        "line_text": "",
        "action": "error",
        "variables": {},
        "depth": 0,
        "error": str(e)
    })
finally:
    sys.settrace(None)

flat_nodes = []
node_idx = 0
while node_idx < len(all_nodes):
    node = all_nodes[node_idx]
    flat_nodes.append({
        "id": get_object_id(node),
        "val": getattr(node, 'val', getattr(node, 'value', None)),
        "left": get_object_id(getattr(node, 'left', None)),
        "right": get_object_id(getattr(node, 'right', None)),
        "next": get_object_id(getattr(node, 'next', None)),
        "neighbors": [get_object_id(n) for n in getattr(node, 'neighbors', [])] if hasattr(node, 'neighbors') and isinstance(getattr(node, 'neighbors'), list) else None
    })
    node_idx += 1

result = {
    "trace": trace_steps,
    "initial_data": flat_nodes
}
json.dumps(result)
`;

  const resultJson = await pyodideInstance.runPythonAsync(runnerScript);
  const data = JSON.parse(resultJson);

  const errorStep = data.trace.find(step => step.error);
  if (errorStep) {
    throw new Error(errorStep.error);
  }

  return data;
};
