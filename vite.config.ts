import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { validateBuildEnvironment, validateBundleModules } from "./scripts/build-policy.ts";

export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  validateBuildEnvironment(env);
  if (command === 'build' && mode === 'demo' && env.VITE_COOKBOOK_DEMO !== '1') throw new Error('Demo build requires VITE_COOKBOOK_DEMO=1.');
  if (command === 'build' && mode === 'non-demo' && env.VITE_COOKBOOK_DEMO === '1') throw new Error('Non-demo build cannot enable demo.');
  return {
    base: process.env.PAGES_BASE_PATH || "/",
    plugins: [react(), {
      name: 'verify-access-mode-isolation',
      generateBundle(_options, bundle) {
        validateBundleModules(env.VITE_COOKBOOK_DEMO === '1', Object.values(bundle).flatMap(item => item.type === 'chunk' ? Object.keys(item.modules) : []));
      },
    }],
    resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  };
});
