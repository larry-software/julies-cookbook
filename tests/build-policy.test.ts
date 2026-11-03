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
