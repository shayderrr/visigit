#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

let electronPath;
try {
  electronPath = require('electron');
} catch {
  console.error('Electron not found. Run: npm install');
  process.exit(1);
}

const appPath = path.join(__dirname, '..');

const child = spawn(electronPath, [appPath], {
  stdio: 'inherit',
  detached: true,
});

child.on('error', (err) => {
  console.error('Failed to start VisiGit:', err.message);
  process.exit(1);
});

child.unref();
