#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');

// Get the path to main.js relative to this file
const mainPath = path.join(__dirname, 'main.js');

// Spawn electron with main.js
const child = spawn(electron, [mainPath], {
    stdio: 'inherit'
});

child.on('close', (code) => {
    process.exit(code);
}); 