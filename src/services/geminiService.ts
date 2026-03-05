import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function breakDownTask(title: string, description: string, context?: string) {
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
  `;

  const response = await ai.models.generateContent({
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
}

export async function executeSubtask(
  subtaskTitle: string, 
  subtaskDescription: string, 
  taskContext: string, 
  model: string = "gemini-3-flash-preview",
  apiKey?: string
) {
  // If a custom API key is provided, we'd use it here. 
  // For this demo, we'll stick to the environment key but simulate the flexibility.
  const client = apiKey ? new GoogleGenAI({ apiKey }) : ai;

  const prompt = `
    Task Context: ${taskContext}
    
    Current Subtask: ${subtaskTitle}
    Instructions: ${subtaskDescription}
    
    Please complete this subtask. 
    IMPORTANT: Use a bullet-style output format for your response to minimize token usage and improve readability.
  `;

  const response = await client.models.generateContent({
    model: model as any,
    contents: prompt,
  });

  return response.text;
}

export async function chatWithAgent(message: string, context: string) {
  const needsBackendKeywords = ['run', 'exec', 'shell', 'search', 'data', 'file', 'mission', 'task', 'deploy', 'install', 'terminal', 'system', 'process'];
  const needsBackend = needsBackendKeywords.some(kw => message.toLowerCase().includes(kw));

  if (needsBackend) {
    try {
      const response = await fetch('/api/chat/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) throw new Error('Gateway unreachable');
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      // Gateway offline scenario
      const prompt = `
        You are Molty, a backup intelligence within the Zion mainframe. 
        The primary Gateway is currently offline. 
        Respond to the user's message from your cached memory and personality context.
        
        User Message: ${message}
        Context: ${context}
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return `${response.text}\n\n⚠️ Gateway offline — responding from cached context only in the ' Anomaly report ' section`;
    }
  } else {
    // Conversational message
    const prompt = `
      You are ClawOOrchestrador, the primary intelligence of the Zion mainframe.
      Respond to the user's conversational message using your personality and memory context.
      
      User Message: ${message}
      Context: ${context}
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  }
}
