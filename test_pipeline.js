import { instrumentJS, runJSSandbox } from './src/services/jsInterpreter.js';
import { mapStructure } from './src/services/structureMapper.js';
import * as Babel from '@babel/standalone';
import assert from 'assert';

globalThis.Babel = Babel;

console.log("🚀 Running visualizer pipeline unit tests...\n");

async function testArrayPipeline() {
  console.log("Testing ARRAY layout tracing & mapping...");
  const code = `
function findElement(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      return mid;
    }
    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}
  `;

  const customInput = "[1, 3, 5, 7, 9], 7";
  const instrumented = await instrumentJS(code, customInput);
  
  // Fake browser document/window globals to run runJSSandbox in Node
  globalThis.document = {
    createElement: () => {
      return {
        style: {},
        contentWindow: {
          postMessage: (data) => {
            // Emulate message exchange
            setTimeout(() => {
              globalThis.dispatchEvent(new MessageEvent('message', {
                data,
                source: globalThis.document.contentWindow
              }));
            }, 0);
          }
        }
      };
    },
    body: {
      appendChild: () => {}
    }
  };
  globalThis.window = globalThis;
  
  // Custom dispatcher
  const listeners = [];
  globalThis.addEventListener = (type, cb) => {
    listeners.push(cb);
  };
  globalThis.removeEventListener = (type, cb) => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
  globalThis.dispatchEvent = (event) => {
    listeners.forEach(cb => cb(event));
  };
  class MessageEvent {
    constructor(type, init) {
      this.data = init.data;
      this.source = init.source;
    }
  }

  // Running standard JS code execution via simple eval (simulating sandbox inside Node)
  // Let's implement a mockup execution in Node environment
  const trace = [];
  const __trace = (line, vars) => {
    trace.push({
      step: trace.length,
      line,
      variables: vars
    });
  };
  const __trace_cond = (line, cond, vars) => {
    __trace(line, vars);
    return cond;
  };

  // Compile and run the instrumented code in Node.js
  const runner = new Function('__trace', '__trace_cond', instrumented);
  runner(__trace, __trace_cond);

  // Map pointers
  const result = mapStructure('ARRAY', trace);

  assert.strictEqual(result.initial_data.length, 5, "initial_data should match input array length");
  assert.deepStrictEqual(result.initial_data, [1, 3, 5, 7, 9], "initial_data array should match input values");
  
  // Verify pointer variables mapped
  const finalStep = result.trace[result.trace.length - 1];
  assert.ok('mid' in finalStep.pointers, "pointer 'mid' should be detected");
  assert.strictEqual(finalStep.pointers.mid, 3, "pointer 'mid' should point to index 3 (value 7)");

  console.log("✅ ARRAY layout test passed!");
}

async function testTreePipeline() {
  console.log("Testing TREE layout node/edge tracking...");
  
  // Emulate execution trace for binary tree DFS
  const rawInitialData = [
    { id: "node_1", val: 10, left: "node_2", right: "node_3" },
    { id: "node_2", val: 5, left: null, right: null },
    { id: "node_3", val: 15, left: null, right: null }
  ];

  const trace = [
    { step: 0, line: 1, variables: { root: "node_1", curr: "node_1" } },
    { step: 1, line: 2, variables: { root: "node_1", curr: "node_2" } },
    { step: 2, line: 3, variables: { root: "node_1", curr: "node_3" } }
  ];

  const result = mapStructure('TREE', trace, rawInitialData);

  assert.strictEqual(result.initial_data.length, 3, "initial_data tree nodes count should be 3");
  
  const step2 = result.trace[1];
  assert.strictEqual(step2.pointers.curr, "node_2", "pointer 'curr' should point to node_2");
  assert.deepStrictEqual(step2.visited_nodes, ["node_1", "node_2"], "visited_nodes should track node_1 and node_2");
  assert.deepStrictEqual(step2.visited_edges, [["node_1", "node_2"]], "visited_edges should track transitions from node_1 to node_2");

  console.log("✅ TREE layout test passed!");
}

async function runAll() {
  try {
    await testArrayPipeline();
    await testTreePipeline();
    console.log("\n🎉 All Visualizer Pipeline Tests Passed Successfully!");
  } catch (error) {
    console.error("\n❌ Test Suite Failed:");
    console.error(error);
    process.exit(1);
  }
}

runAll();
