import path from "node:path";

import react from "@vitejs/plugin-react";
import { globSync } from "glob";
import { defineConfig } from "vite";

const flatWidgetPattern = "src/widgets/*.{js,ts,jsx,tsx,html}";
const dirWidgetPattern = "src/widgets/*/index.tsx";

const flatWidgets = globSync(flatWidgetPattern, { nodir: true }).map((file) => [
  path.basename(file, path.extname(file)),
  path.resolve(file),
]);

const dirWidgets = globSync(dirWidgetPattern, { nodir: true }).map((file) => [
  path.basename(path.dirname(file)),
  path.resolve(file),
]);

const widgetInputs = Object.fromEntries([...flatWidgets, ...dirWidgets]);

export default defineConfig({
  plugins: [react()],
  base: "/assets",
  build: {
    manifest: true,
    minify: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: widgetInputs,
    },
  },
});
