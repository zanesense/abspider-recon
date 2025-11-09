import path from "path";
import { defineConfig from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⬅️ ADD THIS SERVER BLOCK
  server: {
    // Allows Netlify build host access to the development server
    allowedHosts: [
      'devserver-main--abspider-recon.netlify.app',
      'localhost',
      '127.0.0.1'
    ]
  },
  // ⬅️ END OF SERVER BLOCK
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
});
