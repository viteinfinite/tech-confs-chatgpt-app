import { createRequire } from "node:module";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { skybridge } from "skybridge/web";

const require = createRequire(import.meta.url);
const fs = require("node:fs") as { globSync?: (pattern: string) => string[] };

if (!fs.globSync) {
  const { globSync } = require("glob") as { globSync: (pattern: string) => string[] };
  fs.globSync = globSync;
}

export default defineConfig({
  plugins: [skybridge(), react()],
});
