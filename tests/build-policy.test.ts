import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBuildEnvironment, validateBundleModules } from '../scripts/build-policy.ts';
const config = { VITE_FIREBASE_API_KEY: 'fixture', VITE_FIREBASE_AUTH_DOMAIN: 'fixture.invalid', VITE_FIREBASE_PROJECT_ID: 'demo-fixture', VITE_FIREBASE_APP_ID: 'fixture' };
test('build configuration fails closed for ambiguous modes and partial configuration', () => {
  for (const value of ['true', 'false', 'yes', ' 1']) assert.throws(() => validateBuildEnvironment({ VITE_COOKBOOK_DEMO: value }));
  for (const key of Object.keys(config)) assert.throws(() => validateBuildEnvironment({ [key]: config[key as keyof typeof config] }));
  assert.doesNotThrow(() => validateBuildEnvironment({}));
  assert.doesNotThrow(() => validateBuildEnvironment(config));
  assert.doesNotThrow(() => validateBuildEnvironment({ VITE_COOKBOOK_DEMO: '1' }));
  assert.throws(() => validateBuildEnvironment({ ...config, VITE_COOKBOOK_DEMO: '1' }));
  assert.throws(() => validateBuildEnvironment({ VITE_FIREBASE_UNEXPECTED: 'fixture', VITE_COOKBOOK_DEMO: '1' }));
});
test('bundled module checks reject auth in demo and sample data in non-demo', () => {
  for (const id of ['/lib/auth-config.ts', '/lib/firebase-email-auth.ts', '/node_modules/@firebase/auth/dist/index.js']) assert.throws(() => validateBundleModules(true, [id]));
  for (const id of ['/app/demo.tsx', '/lib/demo-backend.ts', '/lib/examples.ts']) assert.throws(() => validateBundleModules(false, [id]));
  assert.doesNotThrow(() => validateBundleModules(true, ['/lib/demo-backend.ts']));
  assert.doesNotThrow(() => validateBundleModules(false, ['/lib/auth-config.ts']));
});

test('release requires explicit non-demo and independent matching project/domain', async () => {
  const { validateReleaseEnvironment, assertFunctionsRuntime } = await import('../scripts/build-policy.ts');
  const valid = { ...config, VITE_COOKBOOK_DEMO: '0', COOKBOOK_EXPECTED_PROJECT_ID: config.VITE_FIREBASE_PROJECT_ID, COOKBOOK_EXPECTED_AUTH_DOMAIN: config.VITE_FIREBASE_AUTH_DOMAIN };
  assert.doesNotThrow(() => validateReleaseEnvironment(valid));
  assert.throws(() => validateReleaseEnvironment({}));
  for (const key of Object.keys(valid)) assert.throws(() => validateReleaseEnvironment({ ...valid, [key]: '' }));
  for (const value of ['1', 'true']) assert.throws(() => validateReleaseEnvironment({ ...valid, VITE_COOKBOOK_DEMO: value }));
  for (const key of ['COOKBOOK_EXPECTED_PROJECT_ID', 'COOKBOOK_EXPECTED_AUTH_DOMAIN']) assert.throws(() => validateReleaseEnvironment({ ...valid, [key]: 'wrong-target' }));
  for (const domain of ['a..com', 'a-.com', 'a.-b.com', 'a'.repeat(64) + '.com']) assert.throws(() => validateReleaseEnvironment({ ...valid, VITE_FIREBASE_AUTH_DOMAIN: domain, COOKBOOK_EXPECTED_AUTH_DOMAIN: domain }));
  assert.doesNotThrow(() => assertFunctionsRuntime('22.23.4', '22'));
  for (const actual of ['24.19.0', '', 'v22.23.4']) assert.throws(() => assertFunctionsRuntime(actual, '22'));
  assert.throws(() => assertFunctionsRuntime('22.23.4', '>=22'));
});
