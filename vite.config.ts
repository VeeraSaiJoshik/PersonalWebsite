import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  // A second preview must not replace the running server's dependency cache.
  cacheDir: process.env.VITE_CACHE_DIR || "node_modules/.vite",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
});
