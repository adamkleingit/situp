#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');

// Get the path to main.js relative to this file
const mainPath = path.join(__dirname, 'main.js');

const args = process.argv.slice(2);
const child = spawn(electron, [mainPath, ...args], { stdio: 'inherit' });

child.on('error', (err) => {
  console.error('❌  Failed to launch Electron:', err.message);
  process.exit(1);
});

child.on('close', (code) => process.exit(code));
