import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
test('actual release command rejects missing, partial, demo and wrong-target environments', () => {
  const baseEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('VITE_') && !key.startsWith('COOKBOOK_')));
  const configured = { VITE_COOKBOOK_DEMO: '0', VITE_FIREBASE_API_KEY: 'fixture', VITE_FIREBASE_AUTH_DOMAIN: 'demo-test.firebaseapp.com', VITE_FIREBASE_PROJECT_ID: 'demo-test', VITE_FIREBASE_APP_ID: 'fixture', COOKBOOK_EXPECTED_PROJECT_ID: 'demo-test', COOKBOOK_EXPECTED_AUTH_DOMAIN: 'demo-test.firebaseapp.com' };
  const cases = [{}, { ...configured, VITE_FIREBASE_APP_ID: '' }, { ...configured, VITE_COOKBOOK_DEMO: '1' }, { ...configured, COOKBOOK_EXPECTED_PROJECT_ID: 'demo-wrong' }, { ...configured, COOKBOOK_EXPECTED_AUTH_DOMAIN: 'wrong.invalid' }];
  for (const env of cases) {
    const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', 'release'], { env: { ...baseEnv, ...env }, encoding: 'utf8', timeout: 15_000 });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Release requires|Incomplete Firebase|must not contain Firebase|Release target mismatch/);
  }
});
