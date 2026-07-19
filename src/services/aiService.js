import { GoogleGenerativeAI } from "@google/generative-ai";
import { instrumentJS, runJSSandbox } from "./jsInterpreter.js";
import { runPythonSandbox } from "./pythonInterpreter.js";
import { mapStructure } from "./structureMapper.js";

const classificationCache = new Map();

// A simple hash function for code strings
const getCodeHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
};

/**
 * Helper to call Gemini API supporting both standard API keys and OAuth Access Tokens (AQ.* / ya29.*)
 */
const callGeminiAPI = async (apiKey, modelName, prompt, responseMimeType = "text/plain", maxOutputTokens = 2048) => {
  const isToken = apiKey.startsWith("AQ.") || apiKey.startsWith("ya29.");
  
  if (isToken) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType,
          temperature: 0.1,
          maxOutputTokens
        }
      })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google API returned status ${response.status}: ${errText}`);
    }
    
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Invalid API response format: empty text candidates");
    }
    return text;
  } else {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelObj = genAI.getGenerativeModel({ model: modelName });
    const result = await modelObj.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType,
        temperature: 0.1,
        maxOutputTokens,
      }
    });
    return result.response.text();
  }
};

/**
 * Stage 1: Classifies the algorithm's layout type using a fast LLM call.
 * Result is cached by source code hash.
 */
export const classifyLayout = async (apiKey, code) => {
  const hash = getCodeHash(code);
  if (classificationCache.has(hash)) {
    return classificationCache.get(hash);
  }

  const prompt = `
You are an expert algorithmic analyzer.
Analyze the following source code and classify it into one of the supported visualizer layout types.

LAYOUT TYPES:
- "ARRAY": Code operates on an array/list with index pointers (two pointers, sliding window, binary search, etc.)
- "STACK": Code uses an explicit stack data structure (push/pop operations)
- "LINKED_LIST": Code traverses or builds a linked list with next pointers
- "TREE": Code operates on binary trees or BSTs (left/right children)
- "GRAPH": Code does DFS/BFS or operates on adjacency lists/matrices
- "MATRIX": Code operates on a 2D grid or matrix
- "SYSTEM": Code simulates architectural components (cache, queue, database, etc.)
- "VARIABLES": Code has simple logic — conditionals, loops over primitives, arithmetic, print statements, basic variable manipulation. USE THIS when no complex data structure is involved.

FEW-SHOT EXAMPLES:
1. num=4; if num%2==0: print("even")
-> { "layout": "VARIABLES", "confidence": 0.99, "reasoning": "Simple conditional on a primitive variable" }

2. for i in range(10): total += i
-> { "layout": "VARIABLES", "confidence": 0.97, "reasoning": "Simple loop accumulating a primitive value" }

3. def twoSum(arr, target): left, right = 0, len(arr)-1 ...
-> { "layout": "ARRAY", "confidence": 0.95, "reasoning": "Array with two pointer indices" }

4. function invertTree(node) { if (!node) return null; let temp = node.left; ...
-> { "layout": "TREE", "confidence": 0.98, "reasoning": "Binary tree node operations" }

5. def nextGreater(nums): stack = []; for num in nums: while stack and stack[-1] < num: stack.pop()
-> { "layout": "STACK", "confidence": 0.92, "reasoning": "Monotonic stack operations" }

6. void dfs(int node, vector<int> adj[], vector<bool>& vis) { vis[node]=true; ...
-> { "layout": "GRAPH", "confidence": 0.95, "reasoning": "Graph traversal on adjacency list" }

7. def uniquePaths(m, n): grid = [[0]*n for _ in range(m)] ...
-> { "layout": "MATRIX", "confidence": 0.96, "reasoning": "2D grid traversal" }

Return ONLY a JSON object in this strict schema:
{
  "layout": "ARRAY" | "STACK" | "LINKED_LIST" | "TREE" | "GRAPH" | "MATRIX" | "SYSTEM" | "VARIABLES",
  "confidence": number (between 0.0 and 1.0),
  "reasoning": "string explanation"
}

Code to classify:
${code}
`;

  try {
    let text = await callGeminiAPI(apiKey, "gemini-1.5-flash", prompt, "application/json", 30);
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);
    if (data.confidence < 0.6) {
      const fallback = { layout: "VARIABLES", confidence: 1.0, reasoning: "Low confidence classification fallback" };
      classificationCache.set(hash, fallback);
      return fallback;
    }
    classificationCache.set(hash, data);
    return data;
  } catch (e) {
    console.error("Layout classification failed, falling back to VARIABLES:", e);
    const fallback = { layout: "VARIABLES", confidence: 1.0, reasoning: "Error classification fallback" };
    classificationCache.set(hash, fallback);
    return fallback;
  }
};

/**
 * Stage E: Pure JS/Python template matching for simple code statements.
 */
const getTemplateExplanation = (codeLines, step) => {
  const lineStr = (codeLines[step.line - 1] || "").trim();
  const vars = step.variables || {};

  // 1. Simple increment / decrement
  let match = lineStr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\+\+|\+= 1|= \1 \+ 1);?$/);
  if (match) {
    const varName = match[1];
    return `${varName} is incremented to ${vars[varName] !== undefined ? vars[varName] : 'next value'}.`;
  }
  
  match = lineStr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:--|-= 1|= \1 - 1);?$/);
  if (match) {
    const varName = match[1];
    return `${varName} is decremented to ${vars[varName] !== undefined ? vars[varName] : 'previous value'}.`;
  }

  // 2. Simple assignment of values
  match = lineStr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z0-9_"'-]+);?$/);
  if (match) {
    const varName = match[1];
    const val = match[2];
    return `${varName} is set to ${val}.`;
  }

  // 3. Pointer transitions
  match = lineStr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\1\.(left|right|next);?$/);
  if (match) {
    const pName = match[1];
    const direction = match[2];
    return `Move pointer '${pName}' to its ${direction} child.`;
  }

  // 4. Return statement
  match = lineStr.match(/^return\s*(.*);?$/);
  if (match) {
    return `Return ${match[1] || 'result'}.`;
  }

  return null;
};

/**
 * Stage E: Generates explanations. Trivial steps are resolved in code.
 * Non-trivial steps are batched and narrated by Gemini 1.5 Flash.
 */
export const generateNarratives = async (apiKey, code, trace) => {
  const codeLines = code.split('\n');

  // Map templated explanations first
  const missingExplanations = [];
  trace.forEach(step => {
    const temp = getTemplateExplanation(codeLines, step);
    if (temp) {
      step.explanation = temp;
    } else {
      missingExplanations.push(step);
    }
  });

  if (missingExplanations.length === 0) return;

  const batchSize = 10;
  const batches = [];
  for (let i = 0; i < missingExplanations.length; i += batchSize) {
    batches.push(missingExplanations.slice(i, i + batchSize));
  }

  const promises = batches.map(async (batch) => {
    const prompt = `
You are an algorithmic visualizer narrating a step-by-step code execution trace.
Given the source code and a batch of real execution trace steps (line numbers and variable snapshots), write a short, clear, 1-sentence plain English explanation of what happens in each step.

CRITICAL INSTRUCTIONS:
- Do not compute new values. ONLY describe what already happened or is being checked in the given step.
- Ground your explanations strictly in the variables provided.
- Keep descriptions extremely short, clear, and focused on the code logic at that line.
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
      let text = await callGeminiAPI(apiKey, "gemini-1.5-flash", prompt, "application/json", 600);
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
      const instrumented = await instrumentJS(code, customInput);
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
