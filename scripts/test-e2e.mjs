import { spawnSync } from 'node:child_process';
const run = (args, extra = {}) => {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: { ...process.env, ...extra } });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run(['scripts/prepare-ocr.mjs']);
run(['node_modules/vite/bin/vite.js', 'build', '--mode', 'demo', '--outDir', 'outputs/e2e-demo'], { VITE_COOKBOOK_DEMO: '1' });
run(['node_modules/vite/bin/vite.js', 'build', '--mode', 'non-demo', '--outDir', 'outputs/e2e-locked'], { VITE_COOKBOOK_DEMO: '0' });
run(['functions/node_modules/typescript/bin/tsc', '-p', 'functions/tsconfig.json']);
run(['scripts/test-auth.mjs', '--browser']);
