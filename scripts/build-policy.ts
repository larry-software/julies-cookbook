export function validateBuildEnvironment(env: Record<string, string | undefined>) {
  const demo = env.VITE_COOKBOOK_DEMO;
  if (demo && demo !== '0' && demo !== '1') throw new Error('VITE_COOKBOOK_DEMO must be 0 or 1.');
  const keys = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'APP_ID'];
  const configured = keys.filter(key => env[`VITE_FIREBASE_${key}`]?.trim());
  if (demo === '1' && Object.entries(env).some(([key, value]) => key.startsWith('VITE_FIREBASE_') && value?.trim())) {
    throw new Error('Demo builds must not contain Firebase configuration.');
  }
  if (configured.length && configured.length !== keys.length) throw new Error('Incomplete Firebase web configuration.');
}

export function validateBundleModules(demo: boolean, modules: string[]) {
  const forbidden = demo
    ? /(?:\/lib\/(?:auth-config|firebase-email-auth)\.|\/(?:@firebase|firebase)\/)/
    : /\/(?:app\/demo|lib\/(?:demo-backend|examples))\./;
  if (modules.some(id => forbidden.test(id.replaceAll('\\', '/')))) {
    throw new Error('Build contains modules from the other access mode.');
  }
}

export function validateReleaseEnvironment(env: Record<string, string | undefined>) {
  validateBuildEnvironment(env);
  if (env.VITE_COOKBOOK_DEMO !== '0') throw new Error('Release requires explicit VITE_COOKBOOK_DEMO=0.');
  for (const key of ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'APP_ID']) {
    if (!env[`VITE_FIREBASE_${key}`]?.trim()) throw new Error('Release requires complete Firebase configuration.');
  }
  const project = env.COOKBOOK_EXPECTED_PROJECT_ID;
  const domain = env.COOKBOOK_EXPECTED_AUTH_DOMAIN;
  if (!project?.trim() || !domain?.trim()) throw new Error('Release requires independent expected target project and auth domain.');
  if (env.VITE_FIREBASE_PROJECT_ID !== project || env.VITE_FIREBASE_AUTH_DOMAIN !== domain) throw new Error('Release target mismatch.');
  const labels = domain.split('.');
  if (domain.length > 253 || labels.length < 2 || !/^[a-z]{2,}$/.test(labels.at(-1)!) || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) throw new Error('Release auth domain must be a hostname.');
}

export function assertFunctionsRuntime(actual: string, expectedMajor: string) {
  if (!/^\d+$/.test(expectedMajor) || actual.split('.')[0] !== expectedMajor) throw new Error('Functions emulator runtime mismatch');
}
