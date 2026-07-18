const POINTER_NAMES = new Set([
  'i', 'j', 'k', 'left', 'right', 'slow', 'fast', 'mid', 'low', 'high', 
  'curr', 'pointer', 'p', 'ptr', 'start', 'end', 'p1', 'p2', 'head', 'tail', 'node'
]);

/**
 * Maps execution variables to pointer indices, coordinate arrays, and node IDs deterministically.
 * Also builds initial_data structures for arrays and matrices, and tracks visited states for trees/graphs.
 * 
 * @param {string} layoutType - The classified layout type (ARRAY, TREE, etc.)
 * @param {Array} trace - The execution trace steps.
 * @param {Array} rawInitialData - Initial nodes list returned from interpreter (if TREE/LINKED_LIST)
 * @returns {object} - { initial_data, trace }
 */
export const mapStructure = (layoutType, trace, rawInitialData = []) => {
  const mappedTrace = [];
  let initial_data = null;

  // 1. Determine Initial Data
  if (layoutType === 'ARRAY' || layoutType === 'STACK') {
    // Find the first array variable in the trace
    const firstStep = trace[0] || {};
    let arrayVarName = null;
    for (const [k, v] of Object.entries(firstStep.variables || {})) {
      if (Array.isArray(v)) {
        arrayVarName = k;
        break;
      }
    }
    if (arrayVarName) {
      initial_data = firstStep.variables[arrayVarName];
    } else {
      initial_data = [];
    }
  } else if (layoutType === 'MATRIX') {
    // Find the first 2D array
    const firstStep = trace[0] || {};
    let matrixVarName = null;
    for (const [k, v] of Object.entries(firstStep.variables || {})) {
      if (Array.isArray(v) && Array.isArray(v[0])) {
        matrixVarName = k;
        break;
      }
    }
    if (matrixVarName) {
      initial_data = firstStep.variables[matrixVarName];
    } else {
      initial_data = [];
    }
  } else if (layoutType === 'TREE' || layoutType === 'LINKED_LIST') {
    initial_data = rawInitialData;
  } else if (layoutType === 'GRAPH') {
    // Reconstruct GRAPH layout structure from neighboring references if needed
    // Otherwise rely on rawInitialData formatted as nodes and edges
    const nodes = rawInitialData.map(n => ({ id: n.id, val: n.val }));
    const edges = [];
    const seenEdges = new Set();

    rawInitialData.forEach(n => {
      if (n.neighbors && Array.isArray(n.neighbors)) {
        n.neighbors.forEach(neighId => {
          if (!neighId) return;
          const edgeKey = [n.id, neighId].sort().join('-');
          if (!seenEdges.has(edgeKey)) {
            seenEdges.add(edgeKey);
            edges.push([n.id, neighId]);
          }
        });
      }
      // Also support left/right as edges if graph representation uses them
      if (n.left) edges.push([n.id, n.left]);
      if (n.right) edges.push([n.id, n.right]);
      if (n.next) edges.push([n.id, n.next]);
    });

    initial_data = { nodes, edges };
  } else {
    // SYSTEM or VARIABLES
    initial_data = rawInitialData || [];
  }

  // 2. Track visited states for TREE and GRAPH
  const visitedNodes = new Set();
  const visitedEdges = [];
  const previousPointers = {};

  // 3. Map pointers and visited states step-by-step
  trace.forEach((step, idx) => {
    const pointers = {};
    const vars = step.variables || {};

    if (layoutType === 'ARRAY' || layoutType === 'STACK') {
      // Find arrays to check bounds
      let arrLen = 0;
      for (const [_, v] of Object.entries(vars)) {
        if (Array.isArray(v)) {
          arrLen = v.length;
          break;
        }
      }
      // Map integer variables matching POINTER_NAMES within array bounds
      for (const [k, v] of Object.entries(vars)) {
        if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < arrLen) {
          if (POINTER_NAMES.has(k)) {
            pointers[k] = v;
          }
        }
      }
    } else if (layoutType === 'MATRIX') {
      // Look for i/j, r/c, row/col coordinate variables
      let r = vars.r !== undefined ? vars.r : (vars.row !== undefined ? vars.row : (vars.i !== undefined ? vars.i : null));
      let c = vars.c !== undefined ? vars.c : (vars.col !== undefined ? vars.col : (vars.j !== undefined ? vars.j : null));
      
      // If we have custom matrix traversal variables
      if (r !== null && c !== null && typeof r === 'number' && typeof c === 'number') {
        pointers['curr'] = [r, c];
      }
    } else if (layoutType === 'TREE' || layoutType === 'LINKED_LIST' || layoutType === 'GRAPH') {
      // Map variables holding node ID string values (like "node_1")
      for (const [k, v] of Object.entries(vars)) {
        if (typeof v === 'string' && /^node_\d+$/.test(v)) {
          pointers[k] = v;
          
          // Visited node tracking
          visitedNodes.add(v);

          // Visited edge tracking (if pointer moved from previous node to this node)
          const prevNode = previousPointers[k];
          if (prevNode && prevNode !== v) {
            const edgeKey = [prevNode, v].sort().join('-');
            if (!visitedEdges.some(e => e.sort().join('-') === edgeKey)) {
              visitedEdges.push([prevNode, v]);
            }
          }
          previousPointers[k] = v;
        }
      }
    }

    mappedTrace.push({
      ...step,
      pointers,
      visited_nodes: Array.from(visitedNodes),
      visited_edges: [...visitedEdges]
    });
  });

  return {
    initial_data,
    trace: mappedTrace
  };
};
