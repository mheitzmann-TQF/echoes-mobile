#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('Starting development servers...');

const expressServer = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, PORT: '5000' }
});

const expoServer = spawn('npx', ['expo', 'start', '--web', '--port', '8081'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env
});

expressServer.on('error', (err) => {
  console.error('Express server error:', err);
  process.exit(1);
});

expoServer.on('error', (err) => {
  console.error('Expo server error:', err);
  process.exit(1);
});

expressServer.on('exit', (code) => {
  console.log(`Express server exited with code ${code}`);
  expoServer.kill();
  process.exit(code || 0);
});

expoServer.on('exit', (code) => {
  console.log(`Expo server exited with code ${code}`);
  expressServer.kill();
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  expressServer.kill();
  expoServer.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  expressServer.kill();
  expoServer.kill();
  process.exit(0);
});

console.log('Development servers started:');
console.log('  - Express API on port 5000');
console.log('  - Expo Metro on port 8081 (proxied through Express)');
