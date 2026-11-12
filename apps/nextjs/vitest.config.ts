import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Match Next.js when a unit test imports a server component.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    // Only `.ts` unit tests run today. Adding component (`.tsx`) tests requires
    // installing `jsdom` + `@testing-library/react`, switching `environment` to
    // "jsdom", and widening this glob to `src/**/*.test.{ts,tsx}`.
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
