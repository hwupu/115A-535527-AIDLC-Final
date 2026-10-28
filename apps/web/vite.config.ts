import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// In compose the api is reachable as http://api:8000; locally as localhost:8000.
const apiTarget = process.env.API_URL ?? "http://localhost:8000";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: { port: 5173, proxy: { "/api": { target: apiTarget, rewrite: (p) => p.replace(/^\/api/, "") } } },
});
