#!/usr/bin/env node
import { spawn } from 'child_process';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

console.log('Starting Zion Orchestrator...');

const server = spawn('npm', ['run', 'dev'], {
  shell: true,
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

// Wait a bit for the server to start before opening the browser
setTimeout(() => {
  console.log(`Opening dashboard at ${URL}...`);
  open(URL);
}, 3000);

process.on('SIGINT', () => {
  server.kill();
  process.exit();
});
