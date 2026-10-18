import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

export default defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "supabase/*", "jest.setup.ts", "scripts/*"],
  },
]);
