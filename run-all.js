import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('>>> Starting Gastranom Fullstack Platform...');

// 1. Start Backend Server
const serverProcess = spawn(npmCmd, ['--prefix', 'server', 'start'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// 2. Start Frontend Client Dev Server
const clientProcess = spawn(npmCmd, ['--prefix', 'client', 'run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\nStopping servers...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
