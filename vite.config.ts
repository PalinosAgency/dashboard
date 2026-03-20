import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Custom Vite plugin to serve the /api directory locally mimicking Vercel serverless functions
const vercelApiPlugin = () => ({
  name: "vercel-api-plugin",
  configureServer(server: any) {
    server.middlewares.use("/api", async (req: any, res: any, next: any) => {
      try {
        const urlPath = req.url.split("?")[0].replace(/\/$/, ""); 
        // req.url is the part after "/api", e.g. "/auth"
        let filePath = path.join(__dirname, "api", urlPath + ".ts");
        if (!fs.existsSync(filePath)) {
          filePath = path.join(__dirname, "api", urlPath + ".js");
        }
        
        if (fs.existsSync(filePath)) {
          // Pass environment variables into process.env so the API finds them
          const env = loadEnv(server.config.mode, process.cwd(), '');
          Object.assign(process.env, env);

          const module = await server.ssrLoadModule(filePath);
          if (module.default) {
            await module.default(req, res);
            return;
          }
        }
        next();
      } catch (err: any) {
        console.error("API Error:", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }

    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  
  plugins: [react(), vercelApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));