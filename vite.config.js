import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` must match the GitHub Pages repo path: https://<user>.github.io/<repo>/
// Override at build time with e.g. `BASE_PATH=/my-repo/ npm run build`.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? "/nepali-proverb-validator/",
});
