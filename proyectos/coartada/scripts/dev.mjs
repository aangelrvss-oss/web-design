// npm run dev — game server (tsx watch, :3000) + Vite client (:5173, LAN-visible).
import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';

const procs = [
  spawn('npx', ['tsx', 'watch', 'src/server/main.ts'], { stdio: 'inherit', env: { ...process.env, PORT: '3000', HOST: '0.0.0.0' } }),
  spawn('npx', ['vite'], { stdio: 'inherit', env: process.env }),
];
const lan = Object.values(networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal);
setTimeout(() => {
  console.log('\n  Coartada dev:  http://localhost:5173');
  if (lan) console.log(`  Phones (same Wi-Fi):  http://${lan.address}:5173\n`);
}, 1500);
const stop = () => procs.forEach((p) => p.kill('SIGTERM'));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', (code) => code && stop()));
