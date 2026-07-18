import { GoogleGenerativeAI } from "@google/generative-ai";
import { instrumentJS, runJSSandbox } from "./jsInterpreter";
import { runPythonSandbox } from "./pythonInterpreter";
import { mapStructure } from "./structureMapper";

/**
 * Stage 1: Classifies the algorithm's layout type using a fast LLM call.
 */
export const classifyLayout = async (apiKey, code) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

  const prompt = `
You are an expert algorithmic analyzer.
Analyze the following source code and classify it into one of the supported visualizer layout types:
"ARRAY", "STACK", "LINKED_LIST", "TREE", "GRAPH", "MATRIX", "SYSTEM", "VARIABLES".

FEW-SHOT EXAMPLES:
1. Two sum with arrays:
def twoSum(arr, target):
    left, right = 0, len(arr) - 1
    ...
-> Output: { "layout": "ARRAY", "confidence": 0.95, "reasoning": "Standard array indexing and two pointers" }

2. Invert binary tree:
function invertTree(node) {
    if (!node) return null;
    let temp = node.left;
    node.left = invertTree(node.right);
    ...
-> Output: { "layout": "TREE", "confidence": 0.98, "reasoning": "Binary tree node inversion with left and right children" }

3. Monotonic Stack example:
def nextGreater(nums):
    stack = []
    for num in nums:
        while stack and stack[-1] < num:
            stack.pop()
    ...
-> Output: { "layout": "STACK", "confidence": 0.92, "reasoning": "Monotonic stack operations push/pop" }

4. Graph DFS:
void dfs(int node, vector<int> adj[], vector<bool>& vis) {
    vis[node] = true;
    for(auto it: adj[node]) { ... }
}
-> Output: { "layout": "GRAPH", "confidence": 0.95, "reasoning": "Standard graph traversal on adjacency list" }

5. Grid Search / Pathfinding:
def uniquePaths(m, n):
    grid = [[0]*n for _ in range(m)]
    ...
-> Output: { "layout": "MATRIX", "confidence": 0.96, "reasoning": "Grid/2D matrix paths" }

6. Cache Aside Caching System:
function getUser(id) {
    let u = cache.get(id);
    if (!u) {
        u = db.get(id);
        cache.set(id, u);
    }
    return u;
}
-> Output: { "layout": "SYSTEM", "confidence": 0.94, "reasoning": "Simulating App -> Cache -> DB architectural components" }

Return a JSON object in this strict schema:
{
  "layout": "ARRAY" | "STACK" | "LINKED_LIST" | "TREE" | "GRAPH" | "MATRIX" | "SYSTEM" | "VARIABLES",
  "confidence": number (between 0.0 and 1.0),
  "reasoning": "string explanation"
}

Code to classify:
${code}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 256,
      }
    });

    let text = result.response.text();
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);
    if (data.confidence < 0.6) {
      return { layout: "VARIABLES", confidence: 1.0, reasoning: "Low confidence classification fallback" };
    }
    return data;
  } catch (e) {
    console.error("Layout classification failed, falling back to VARIABLES:", e);
    return { layout: "VARIABLES", confidence: 1.0, reasoning: "Error classification fallback" };
  }
};

/**
 * Stage 4: Generates natural language explanations in batches of 10 steps to save quota.
 */
export const generateNarratives = async (apiKey, code, trace) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

  const batchSize = 10;
  const batches = [];
  for (let i = 0; i < trace.length; i += batchSize) {
    batches.push(trace.slice(i, i + batchSize));
  }

  const promises = batches.map(async (batch) => {
    const prompt = `
You are an algorithmic visualizer narrating a step-by-step code execution trace.
Given the source code and a batch of real execution trace steps (line numbers and variable snapshots), write a short, clear, 1-sentence plain English explanation of what happens in each step.

CRITICAL INSTRUCTIONS:
- Do not compute new values. ONLY describe what already happened or is being checked in the given step.
- Ground your explanations strictly in the variables provided.
- Keep descriptions short, clear, and focused on the code logic at that line.
- The output MUST be a JSON array of strings, where each element corresponds to the explanation for the respective step in the batch.

Source Code:
${code.split('\n').map((l, idx) => `${idx + 1}: ${l}`).join('\n')}

Batch of steps to explain:
${JSON.stringify(batch.map(s => ({ step: s.step, line: s.line, variables: s.variables })), null, 2)}

Return a strict JSON array of strings:
[
  "Explanation for first step in batch...",
  "Explanation for second step in batch..."
]
`;

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      });

      let text = result.response.text();
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const explanations = JSON.parse(text);
      if (Array.isArray(explanations)) {
        batch.forEach((step, idx) => {
          step.explanation = explanations[idx] || "Executing statement...";
        });
      }
    } catch (e) {
      console.error("Batch explanation failed:", e);
      batch.forEach(step => {
        step.explanation = `Line ${step.line}: variables are ${JSON.stringify(step.variables)}`;
      });
    }
  });

  await Promise.all(promises);
};

/**
 * Main entry point: Executes the 5-stage pipeline for tracing and visual mapping.
 */
export const generateExecutionTrace = async (apiKey, code, customInput = null) => {
  if (!apiKey) throw new Error("API Key is missing");

  // Stage 1: Layout Classification
  const classification = await classifyLayout(apiKey, code);
  const layout = classification.layout;

  // Detect language
  const isPython = code.includes('def ') || code.includes('import ') || code.includes('print(');

  let rawTrace = [];
  let rawInitialData = [];

  // Stage 2: Sandbox Execution Tracing
  try {
    if (isPython) {
      const data = await runPythonSandbox(code, customInput);
      rawTrace = data.trace;
      rawInitialData = data.initial_data;
    } else {
      const instrumented = instrumentJS(code, customInput);
      const data = await runJSSandbox(instrumented);
      rawTrace = data.trace;
      rawInitialData = data.initial_data;
    }
  } catch (err) {
    throw new Error(`Execution error: ${err.message}`);
  }

  if (!rawTrace || rawTrace.length === 0) {
    throw new Error("Execution trace is empty. Ensure your code executes successfully.");
  }

  // Stage 3: Structure and Pointer Mapping
  const mapped = mapStructure(layout, rawTrace, rawInitialData);

  // Stage 4: Natural Language Narrative Explanations
  await generateNarratives(apiKey, code, mapped.trace);

  // Return formatted results adhering to contract
  return {
    layout_type: layout,
    confidence: classification.confidence,
    root_id: layout === 'TREE' ? 'node_1' : undefined,
    initial_data: mapped.initial_data,
    trace: mapped.trace
  };
};
