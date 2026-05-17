import { spawn } from 'node:child_process';

const nodeOptions = process.env.NODE_OPTIONS || '';

if (process.platform === 'win32' && !nodeOptions.includes('--use-system-ca')) {
  process.env.NODE_OPTIONS = `${nodeOptions} --use-system-ca`.trim();
}

const child = spawn('tsx', ['watch', 'src/index.ts'], {
  env: process.env,
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
