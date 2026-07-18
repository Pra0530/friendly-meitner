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
  const isInvoked = mainFuncName ? new RegExp(`\\b${mainFuncName}\\s*\\(`).test(code.split('\n').slice(1).join('\n')) : false;

  let executionCode = code;
  if (customInput && mainFuncName) {
    executionCode += `\n\nprint(${mainFuncName}(${customInput}))`;
  } else if (!isInvoked && mainFuncName) {
    executionCode += `\n\nprint(${mainFuncName}())`;
  }

  // Escape backslashes and quotes for Python raw string execution
  const escapedCode = executionCode.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

  const runnerScript = `
import sys
import json

trace_steps = []
object_ids = {}
all_nodes = []

def get_object_id(obj):
    if obj is None:
        return None
    obj_id = id(obj)
    if obj_id not in object_ids:
        # Check if it looks like a tree/list node object
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
    
    # Check if node object
    node_id = get_object_id(val)
    if node_id and isinstance(node_id, str) and node_id.startswith("node_"):
        return node_id
        
    try:
        json.dumps(val)
        return val
    except Exception:
        return str(val)

def tracer(frame, event, arg):
    if event == 'line':
        line = frame.f_lineno
        # Capture variables in local scope
        variables = {}
        for k, v in frame.f_locals.items():
            if k.startswith('__') or k in ['trace_steps', 'tracer', 'sys', 'json', 'object_ids', 'all_nodes', 'get_object_id', 'serialize_val']:
                continue
            variables[k] = serialize_val(v)
        
        trace_steps.append({
            "step": len(trace_steps),
            "line": line,
            "variables": variables
        })
    return tracer

user_code = """${escapedCode}"""

# Inject and run tracer
sys.settrace(tracer)
try:
    exec(user_code, globals())
except Exception as e:
    trace_steps.append({
        "step": len(trace_steps),
        "line": -1,
        "variables": {},
        "error": str(e)
    })
finally:
    sys.settrace(None)

# Flatten and extract node structures for initial_data
flat_nodes = []
for node in all_nodes:
    flat_nodes.append({
        "id": get_object_id(node),
        "val": getattr(node, 'val', getattr(node, 'value', None)),
        "left": get_object_id(getattr(node, 'left', None)),
        "right": get_object_id(getattr(node, 'right', None)),
        "next": get_object_id(getattr(node, 'next', None)),
        "neighbors": [get_object_id(n) for n in getattr(node, 'neighbors', [])] if hasattr(node, 'neighbors') and isinstance(getattr(node, 'neighbors'), list) else None
    })

result = {
    "trace": trace_steps,
    "initial_data": flat_nodes
}
json.dumps(result)
`;

  const resultJson = await pyodideInstance.runPythonAsync(runnerScript);
  const data = JSON.parse(resultJson);

  // Check for runtime error in trace
  const errorStep = data.trace.find(step => step.error);
  if (errorStep) {
    throw new Error(errorStep.error);
  }

  return data;
};
