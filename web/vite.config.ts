import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { skybridge } from "skybridge/web";

export default defineConfig({
  plugins: [skybridge(), react()],
});
