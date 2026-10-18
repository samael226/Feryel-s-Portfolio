import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Feryel-s-Portfolio/",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT || 5173)
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PREVIEW_PORT || 4173)
  }
});
