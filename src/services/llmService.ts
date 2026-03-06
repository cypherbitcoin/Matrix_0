import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini only if key is present
const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || "";
const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

async function callLocalLLM(prompt: string, options: any = {}) {
  try {
    const response = await fetch('/api/chat/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, ...options })
    });
    if (!response.ok) throw new Error('Local LLM unreachable');
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Local LLM Error:", error);
    return null;
  }
}

export async function breakDownTask(title: string, description: string, context?: string, apiKey?: string) {
  const prompt = `
    You are an expert project manager. Break down the following task into a logical sequence of subtasks.
    
    Task Title: ${title}
    Task Description: ${description}
    ${context ? `Additional Context from Documents: ${context}` : ""}
    
    Return the subtasks as a JSON array of objects, each with:
    - id: a unique string
    - title: short title
    - description: detailed instructions for an AI agent
    
    Focus on being efficient and logical.
    IMPORTANT: Return ONLY the JSON array.
  `;

  const client = apiKey ? new GoogleGenAI({ apiKey }) : ai;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["id", "title", "description"],
            },
          },
        },
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.warn("Gemini failed, falling back to local...");
    }
  }

  // Fallback to local LLM
  const localResponse = await callLocalLLM(prompt);
  if (localResponse) {
    try {
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = localResponse.match(/\[[\s\S]*\]/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : localResponse);
    } catch (e) {
      console.error("Failed to parse local LLM response as JSON", e);
    }
  }
  
  return [];
}

export async function executeSubtask(
  subtaskTitle: string, 
  subtaskDescription: string, 
  taskContext: string, 
  model: string = "gemini-3-flash-preview",
  apiKey?: string
) {
  const prompt = `
    Task Context: ${taskContext}
    
    Current Subtask: ${subtaskTitle}
    Instructions: ${subtaskDescription}
    
    Please complete this subtask. 
    IMPORTANT: Use a bullet-style output format for your response to minimize token usage and improve readability.
  `;

  const client = apiKey ? new GoogleGenAI({ apiKey }) : ai;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: model as any,
        contents: prompt,
      });
      return response.text;
    } catch (e) {
      console.warn("Gemini execution failed, falling back to local...");
    }
  }

  return await callLocalLLM(prompt) || "Error: No LLM available for execution.";
}

export async function chatWithAgent(message: string, context: string, apiKey?: string) {
  const needsBackendKeywords = ['run', 'exec', 'shell', 'search', 'data', 'file', 'mission', 'task', 'deploy', 'install', 'terminal', 'system', 'process'];
  const needsBackend = needsBackendKeywords.some(kw => message.toLowerCase().includes(kw));

  const prompt = `
    Context: ${context}
    User Message: ${message}
    
    You are ClawOOrchestrador, the primary intelligence of the Zion mainframe.
    Respond to the user's message using your personality and memory context.
  `;

  const client = apiKey ? new GoogleGenAI({ apiKey }) : ai;

  // Always try local first if it's a "system" command or if Gemini is missing
  if (needsBackend || !client) {
    const localResponse = await callLocalLLM(prompt);
    if (localResponse) return localResponse;
  }

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    } catch (e) {
      return "⚠️ System Error: Unable to reach intelligence nodes.";
    }
  }

  return "⚠️ System Offline: No local or cloud intelligence detected.";
}
