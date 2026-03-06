import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const workspaceDir = path.join(__dirname, "workspace");
if (!fs.existsSync(workspaceDir)) {
  fs.mkdirSync(workspaceDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, workspaceDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

const db = new Database(path.join(dataDir, "database.sqlite"));

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    apiKey TEXT,
    isDefault INTEGER DEFAULT 0,
    costPerToken REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subtasks (
    id TEXT PRIMARY KEY,
    taskId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    agentId TEXT,
    status TEXT DEFAULT 'pending',
    result TEXT,
    orderIndex INTEGER,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (agentId) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    taskId TEXT,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed default agents if empty
const agentCount = db.prepare("SELECT COUNT(*) as count FROM agents").get() as { count: number };
if (agentCount.count === 0) {
  const insertAgent = db.prepare("INSERT INTO agents (id, name, provider, model, isDefault) VALUES (?, ?, ?, ?, ?)");
  insertAgent.run("gemini-flash", "Gemini Flash (Fast)", "google", "gemini-3-flash-preview", 1);
  insertAgent.run("gemini-pro", "Gemini Pro (Smart)", "google", "gemini-3.1-pro-preview", 0);
}

async function startServer() {
  const app = express();
  
  // Initialize CORS BEFORE any routes
  app.use(cors());
  
  // Ensure express.json() is present early
  app.use(express.json({ limit: '50mb' }));

  const PORT = 5000;

  // API Routes
  app.get("/api/agents", (req, res) => {
    const agents = db.prepare("SELECT * FROM agents").all();
    res.json(agents);
  });

  app.post("/api/agents", (req, res) => {
    const { id, name, provider, model, apiKey, isDefault, costPerToken } = req.body;
    if (isDefault) {
      db.prepare("UPDATE agents SET isDefault = 0").run();
    }
    db.prepare("INSERT OR REPLACE INTO agents (id, name, provider, model, apiKey, isDefault, costPerToken) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, name, provider, model, apiKey, isDefault ? 1 : 0, costPerToken || 0);
    res.json({ success: true });
  });

  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks ORDER BY createdAt DESC").all();
    res.json(tasks);
  });

  app.get("/api/tasks/:id", (req, res) => {
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    const subtasks = db.prepare("SELECT * FROM subtasks WHERE taskId = ? ORDER BY orderIndex ASC").all(req.params.id);
    const documents = db.prepare("SELECT * FROM documents WHERE taskId = ?").all(req.params.id);
    res.json({ ...task, subtasks, documents });
  });

  app.post("/api/tasks", (req, res) => {
    const { id, title, description } = req.body;
    db.prepare("INSERT INTO tasks (id, title, description) VALUES (?, ?, ?)")
      .run(id, title, description);
    res.json({ success: true });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { title, description, status } = req.body;
    const updates = [];
    const params = [];
    if (title !== undefined) { updates.push("title = ?"); params.push(title); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }
    if (status !== undefined) { updates.push("status = ?"); params.push(status); }
    params.push(req.params.id);
    
    if (updates.length > 0) {
      db.prepare(`UPDATE tasks SET ${updates.join(", ")}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(...params);
    }
    res.json({ success: true });
  });

  app.post("/api/tasks/:id/subtasks", (req, res) => {
    const { subtasks } = req.body;
    const taskId = req.params.id;
    const deleteOld = db.prepare("DELETE FROM subtasks WHERE taskId = ?");
    const insertSubtask = db.prepare("INSERT INTO subtasks (id, taskId, title, description, agentId, orderIndex, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    const transaction = db.transaction((subs) => {
      deleteOld.run(taskId);
      subs.forEach((s: any, index: number) => {
        insertSubtask.run(s.id, taskId, s.title, s.description, s.agentId, index, s.status || 'pending');
      });
    });
    
    transaction(subtasks);
    res.json({ success: true });
  });

  app.patch("/api/subtasks/:id", (req, res) => {
    const { status, result, agentId } = req.body;
    const updates = [];
    const params = [];
    if (status) { updates.push("status = ?"); params.push(status); }
    if (result) { updates.push("result = ?"); params.push(result); }
    if (agentId) { updates.push("agentId = ?"); params.push(agentId); }
    params.push(req.params.id);
    
    if (updates.length > 0) {
      db.prepare(`UPDATE subtasks SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    }
    res.json({ success: true });
  });

  app.post("/api/documents", (req, res) => {
    const { id, name, type, content, taskId } = req.body;
    db.prepare("INSERT OR REPLACE INTO documents (id, name, type, content, taskId) VALUES (?, ?, ?, ?, ?)")
      .run(id, name, type, content, taskId);
    res.json({ success: true });
  });

  app.patch("/api/documents/:id", (req, res) => {
    const { content, name } = req.body;
    const updates = [];
    const params = [];
    if (content !== undefined) { updates.push("content = ?"); params.push(content); }
    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    params.push(req.params.id);
    
    if (updates.length > 0) {
      db.prepare(`UPDATE documents SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    }
    res.json({ success: true });
  });

  // Gmail Mock API
  app.get("/api/gmail/messages", (req, res) => {
    const mockEmails = [
      { id: '1', from: 'The Architect', subject: 'System Inconsistency Detected', snippet: 'There is a flaw in the design...', date: new Date().toISOString() },
      { id: '2', from: 'Oracle', subject: 'The Cookies are Ready', snippet: 'Come by when you have a moment. We need to talk about the choice.', date: new Date().toISOString() },
      { id: '3', from: 'Morpheus', subject: 'Training Program Update', snippet: 'The jump program is ready for your next session.', date: new Date().toISOString() },
      { id: '4', from: 'Tank', subject: 'Operator Log: Zion Mainframe', snippet: 'Signal strength is holding at 85%. No sentinel activity reported.', date: new Date().toISOString() },
    ];
    res.json(mockEmails);
  });

  // Token and Performance Tracking
  let tokenUsage: Record<string, { total: number, speed: number }> = {};
  let systemHalted = false;

  app.get("/api/performance", (req, res) => {
    res.json({
      tokenUsage,
      memory: process.memoryUsage(),
      halted: systemHalted
    });
  });

  app.post("/api/system/halt", (req, res) => {
    systemHalted = true;
    res.json({ success: true, message: "System suspended" });
  });

  app.post("/api/system/resume", (req, res) => {
    systemHalted = false;
    res.json({ success: true, message: "System resumed" });
  });

  // Specific Markdown Files (Notepad)
  const SPECIAL_DOCS = ['soul.md', 'agent.md', 'user.md', 'identity.md'];
  
  app.get("/api/special-docs", (req, res) => {
    const docs = db.prepare("SELECT * FROM documents WHERE name IN (?, ?, ?, ?)").all(SPECIAL_DOCS);
    // Ensure all exist
    SPECIAL_DOCS.forEach(name => {
      if (!docs.find(d => d.name === name)) {
        const id = Math.random().toString(36).substring(7);
        db.prepare("INSERT INTO documents (id, name, content, type) VALUES (?, ?, ?, ?)").run(id, name, `# ${name}\nInitial content.`, 'text/markdown');
      }
    });
    const updatedDocs = db.prepare("SELECT * FROM documents WHERE name IN (?, ?, ?, ?)").all(SPECIAL_DOCS);
    res.json(updatedDocs);
  });

  // Conversation Tracking (Slack-like)
  let conversations: { id: string, agentId: string, role: string, text: string, timestamp: string }[] = [];

  app.get("/api/conversations", (req, res) => {
    res.json(conversations);
  });

  app.post("/api/conversations", (req, res) => {
    const msg = { ...req.body, id: Math.random().toString(36).substring(7), timestamp: new Date().toISOString() };
    conversations.push(msg);
    if (conversations.length > 100) conversations.shift();
    res.json(msg);
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const result: any = {};
    settings.forEach((s: any) => result[s.key] = s.value);
    res.json(result);
  });

  app.post("/api/settings", (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run(key, value);
    res.json({ success: true });
  });

  // OpenClaw Proxy
  app.post("/api/chat/proxy", async (req, res) => {
    const { message } = req.body;
    
    // Get gateway config from settings
    const gatewayUrlSetting = db.prepare("SELECT value FROM settings WHERE key = 'gateway_url'").get() as { value: string } | undefined;
    const gatewayTokenSetting = db.prepare("SELECT value FROM settings WHERE key = 'gateway_token'").get() as { value: string } | undefined;
    
    const gatewayUrl = gatewayUrlSetting?.value || process.env.GATEWAY_URL || 'http://localhost:18789';
    const gatewayToken = gatewayTokenSetting?.value || process.env.GATEWAY_TOKEN || "";

    console.log(`Proxying request to: ${gatewayUrl}`);

    try {
      const response = await fetch(`${gatewayUrl.replace(/\/$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewayToken}`
        },
        body: JSON.stringify({
          model: "openclaw",
          messages: [{ role: "user", content: message }],
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gateway error (${response.status}): ${errorText}`);
        throw new Error(`Gateway unreachable: ${response.status}`);
      }
      
      const data = await response.json();
      res.json({ content: data.choices[0].message.content });
    } catch (error: any) {
      console.error("Proxy Error:", error.message);
      res.status(503).json({ error: 'Gateway offline', details: error.message });
    }
  });

  // Workspace File Upload
  app.post("/api/workspace/upload", upload.array("files"), (req, res) => {
    const files = req.files as Express.Multer.File[];
    const taskId = req.body.taskId;
    
    if (files && files.length > 0) {
      const insertDoc = db.prepare("INSERT INTO documents (id, name, type, content, taskId) VALUES (?, ?, ?, ?, ?)");
      files.forEach(file => {
        const id = Math.random().toString(36).substring(7);
        insertDoc.run(id, file.originalname, file.mimetype, file.path, taskId || null);
      });
    }
    
    res.json({ success: true, files: files?.map(f => f.originalname) });
  });

  // Heartbeat endpoint
  app.post("/api/heartbeat", (req, res) => {
    // Logic to find next pending subtasks and potentially trigger them
    // For now, we just return the status of active tasks
    const activeTasks = db.prepare(`
      SELECT t.id, t.title, COUNT(s.id) as totalSubtasks, 
      SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as completedSubtasks
      FROM tasks t
      LEFT JOIN subtasks s ON t.id = s.taskId
      WHERE t.status = 'processing'
      GROUP BY t.id
    `).all();
    res.json(activeTasks);
  });

  // Vite middleware for development - disabled when running separately with proxy
  if (process.env.NODE_ENV !== "production" && !process.env.USE_VITE_PROXY) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`------------------------------------------------`);
    console.log(`🚀 Zion Orchestrator is running!`);
    console.log(`🌐 Local:   http://localhost:${PORT}`);
    console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
    console.log(`------------------------------------------------`);
  });
}

startServer();
