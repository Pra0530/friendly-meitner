import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateExecutionTrace = async (apiKey, code, customInput = null) => {
  if (!apiKey) throw new Error("API Key is missing");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

  const prompt = `
You are an algorithmic code visualizer.
Trace the following code step-by-step and return a JSON object describing the execution trace.
We support layout types: "ARRAY", "LINKED_LIST", "TREE", "GRAPH", "MATRIX", "VARIABLES", "STACK", "SYSTEM".

Analyze what the code is doing, pick the best layout, define the initial data structure, and then trace the variables/pointers line by line.

CRITICAL INSTRUCTIONS:
- Trace the code EXACTLY as a computer would. YOU MUST NOT SKIP ANY ITERATIONS. 
- Never summarize the execution. Go step-by-step through the entire loop until the code naturally returns.
- Look at the actual data structure values before deciding which if/else branch to take.
- Line numbers MUST perfectly match the 1-indexed line numbers of the provided code block. Double check your line numbers.
- For a while/for loop, trace the loop evaluation line, then the inner lines, then the loop evaluation line again for each iteration.
- If a pointer/index goes out of bounds or becomes null, set its value to -1 or "null".
- RANGE LOOPS MANDATORY RULE: If the code uses a loop to iterate over a range of numbers (e.g. "for i in range(start, end)" or a standard for loop), you MUST use the "ARRAY" layout. The "initial_data" MUST be the complete array of numbers in that range (e.g. [9, 10, 11, 12, 13, 14, 15, 16, 17]). The loop variable (e.g. "i") MUST be a pointer representing the INDEX of the current number in the initial_data array, NOT the value itself (e.g. if i is 10, the pointer points to index 1). DO NOT use the "VARIABLES" layout for code that loops over ranges of numbers!

DATA SCHEMAS based on layout_type:
- ARRAY or LINKED_LIST or STACK: "initial_data": [10, 20, 30] (array of values). Pointers point to indices. STACK is for Monotonic Stacks. (If the code iterates over a range of numbers, use ARRAY layout and set initial_data to the array of numbers in that range, and set the pointer to the index of the current number).
- TREE: "initial_data": [{ "id": "n1", "val": 10, "left": "n2", "right": "n3" }, { "id": "n2", "val": 5 }]. "root_id": "n1". Pointers point to "id" strings!
- GRAPH: "initial_data": { "nodes": [{ "id": "A", "val": 1 }], "edges": [["A", "B"]] }. Pointers point to "id" strings!
- MATRIX: "initial_data": [[" ", " "], [" ", " "]]. Trace step can optionally include "matrix_state" to reflect changes. Pointers point to [row, col] coordinates!
- SYSTEM: "initial_data": [{"id": "app", "type": "server", "label": "App", "color": "blue"}, {"id": "db", "type": "database", "label": "DB", "color": "green"}]. Trace step includes "active_flow": {"from": "app", "to": "db", "label": "Query DB"}

The JSON MUST exactly match this format:
{
  "layout_type": "ARRAY" | "LINKED_LIST" | "TREE" | "GRAPH" | "MATRIX" | "VARIABLES" | "STACK" | "SYSTEM",
  "root_id": "<only_if_tree>",
  "initial_data": <depends_on_schema_above>,
  "trace": [
    {
      "line": <line_number>,
      "matrix_state": <optional_updated_2d_array_for_matrix>,
      "visited_nodes": <optional_array_of_visited_node_ids_for_tree_or_graph>,
      "visited_edges": <optional_array_of_visited_edges_like_[["A","B"]]_for_tree_or_graph>,
      "active_flow": <optional_flow_object_for_system_layout_like__{"from":"app","to":"db","label":"Write"}>,
      "explanation": "<brief_description_of_step>",
      "reasonTag": "<reason tag: 'new-min' | 'new-max-profit' | 'loop-check' | 'init' | 'other'>",
      "pointers": { "<name>": <index_or_id_or_coordinate_array> },
      "variables": { "<name>": "<value_as_string>" }
    }
  ]
}

Code to trace:
${code.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n')}

${customInput ? `CRITICAL: If the code accepts an array/list as input, execute the main function using this exact input data: [${customInput}] and set initial_data to [${customInput}]. If the code does not process an array/list input (e.g. it only uses scalar values or ranges), ignore this custom input and select the best layout (e.g., ARRAY for ranges, where initial_data is the range array).` : ''}
`;

  let rawText = "";
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 8192,
      }
    });
    
    rawText = result.response.text();
    // Sometimes Gemini wraps JSON in markdown blocks even when responseMimeType is set
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(rawText);
  } catch (error) {
    console.error("AI Generation Failed:", error, rawText);
    throw new Error(`Failed to trace code: ${error.message || "Invalid output from AI"}`);
  }
};
