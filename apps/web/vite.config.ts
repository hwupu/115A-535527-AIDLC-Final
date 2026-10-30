import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// In compose the api is reachable as http://api:8000; locally as localhost:8000.
const apiTarget = process.env.API_URL ?? "http://localhost:8000";

export default defineConfig({
  // VITE_* variables come from the repo-root .env (shared with docker compose).
  envDir: fileURLToPath(new URL("../..", import.meta.url)),
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", env: { VITE_API_MOCK: "1" } },
  server: { port: 5173, proxy: { "/api": { target: apiTarget, rewrite: (p) => p.replace(/^\/api/, "") } } },
});
