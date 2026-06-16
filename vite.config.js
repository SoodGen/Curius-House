import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Subdomain (house.curiousventures.xyz) serves from root, so no base path needed.
export default defineConfig({
  plugins: [react()],
});
