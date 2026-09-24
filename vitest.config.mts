import { defineConfig } from "vitest/config";
import path from "path";
import fs from "fs";

// Load .env.local into process.env for local DB and API tests
const envPath = path.resolve(import.meta.dirname, "./.env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...rest] = trimmed.split("=");
      if (key && rest.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    }
  }
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
