import path from "path";
import fs from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const copyDirectory = (source: string, destination: string) => {
  if (!fs.existsSync(source)) return;
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
};

const getContentType = (filePath: string) => {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".js") return "application/javascript; charset=utf-8";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".html") return "text/html; charset=utf-8";
  return "application/octet-stream";
};

const docsSitePlugin = () => ({
  name: "abspider-docs-site",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith("/docs")) {
        next();
        return;
      }

      const url = new URL(req.url, "http://localhost");
      const relativePath = url.pathname === "/docs" || url.pathname === "/docs/"
        ? "index.html"
        : decodeURIComponent(url.pathname.replace(/^\/docs\/?/, ""));
      const docsRoot = path.resolve(__dirname, "docs");
      const filePath = path.resolve(docsRoot, relativePath);

      if (!filePath.startsWith(docsRoot) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        next();
        return;
      }

      if (!filePath.endsWith(".html")) {
        res.setHeader("Content-Type", getContentType(filePath));
        res.end(fs.readFileSync(filePath));
        return;
      }

      server.transformIndexHtml(url.pathname, fs.readFileSync(filePath, "utf8"))
        .then((html) => {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(html);
        })
        .catch(next);
    });
  },
  closeBundle() {
    copyDirectory(path.resolve(__dirname, "docs"), path.resolve(__dirname, "dist", "docs"));
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), docsSitePlugin()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    include: ['lucide-react'], // Explicitly include lucide-react for optimization
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
});
