// Stage only compiled code and synthetic config: never load repository .env files.
import { mkdtemp, cp, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const stage = await mkdtemp(join(tmpdir(), 'cookbook-auth-'));
try {
  await mkdir(join(stage, 'functions'));
  await cp(join(root, 'functions/lib'), join(stage, 'functions/lib'), { recursive: true });
  const functionsPackage = JSON.parse(await readFile(join(root, 'functions/package.json'), 'utf8'));
  const expectedMajor = functionsPackage.engines.node;
  if (!/^\d+$/.test(expectedMajor)) throw new Error('Functions runtime must declare an explicit Node major.');
  await writeFile(join(stage, 'functions/package.json'), JSON.stringify({ ...functionsPackage, main: 'runtime-check.mjs' }));
  await writeFile(join(stage, 'functions/runtime-check.mjs'), `
    if (process.versions.node.split('.')[0] !== ${JSON.stringify(expectedMajor)}) throw new Error('Functions emulator runtime mismatch');
    console.log('Verified Functions runtime: ' + process.version);
    export * from './lib/index.js';
  `);
  await symlink(join(root, 'functions/node_modules'), join(stage, 'functions/node_modules'), 'dir');
  await writeFile(join(stage, 'functions/.env.local'), 'COOKBOOK_EMAILS=julie@example.com,isak@example.com\n');
  await writeFile(join(stage, 'firebase.json'), JSON.stringify({
    functions: [{ source: 'functions', codebase: 'cookbook-auth' }],
    emulators: { auth: { host: '127.0.0.1', port: 9099 }, functions: { host: '127.0.0.1', port: 5001 }, ui: { enabled: false }, singleProjectMode: true },
  }));
  // Deliberately exclude credentials, cloud project variables and allowlists.
  const env = Object.fromEntries(['PATH', 'SystemRoot', 'TMPDIR'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
  env.PATH = join(root, 'functions/node_modules/node/bin') + ':' + (env.PATH || '');
  env.XDG_CONFIG_HOME = stage;
  env.CI = 'true';
  const result = spawnSync(join(root, 'functions/node_modules/node/bin/node'), [join(root, 'node_modules/firebase-tools/lib/bin/firebase.js'),
    'emulators:exec', '--only', 'auth,functions', '--project', 'demo-julies-kokebok',
    `"${process.execPath}" --test "${join(root, 'tests/email-auth-emulator.test.mjs')}"`], { cwd: stage, env, stdio: 'inherit', timeout: 120_000 });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally { await rm(stage, { recursive: true, force: true }); }
