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
