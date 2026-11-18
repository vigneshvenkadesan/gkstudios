import { spawn } from 'node:child_process';
import path from 'node:path';

const rawArgs = process.argv.slice(2);
let port = '3000';
let hostname = '0.0.0.0';

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--port' || arg === '-p') {
    if (rawArgs[i + 1]) port = rawArgs[++i];
  } else if (arg.startsWith('--port=')) {
    port = arg.split('=')[1] || port;
  } else if (arg === '--host' || arg === '-H') {
    if (rawArgs[i + 1] && !rawArgs[i + 1].startsWith('-')) {
      hostname = rawArgs[++i];
    }
  } else if (arg.startsWith('--host=')) {
    hostname = arg.split('=')[1] || hostname;
  }
}

const nextBin = path.resolve(process.cwd(), 'node_modules', '.bin', 'next');
const child = spawn(nextBin, ['dev', '-p', port, '-H', hostname], {
  stdio: 'inherit',
  env: process.env,
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    if (!child.killed) {
      child.kill(sig);
    }
  });
}

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
