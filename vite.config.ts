import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Только `vite` / `npm run dev`: POST сохраняет public/global-locations.json.
 * В production-сборке плагин не подключается (`apply: 'serve'`).
 */
function devSaveGlobalLocationsPlugin(): Plugin {
  return {
    name: "dev-save-global-locations",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.method !== "POST") {
            next();
            return;
          }
          const pathname = req.url?.split("?")[0];
          if (pathname !== "/__dev/save-global-locations") {
            next();
            return;
          }
          const chunks: Buffer[] = [];
          req.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
          });
          req.on("end", () => {
            try {
              const raw = Buffer.concat(chunks).toString("utf8");
              const parsed: unknown = JSON.parse(raw);
              if (
                parsed === null ||
                typeof parsed !== "object" ||
                Array.isArray(parsed)
              ) {
                res.statusCode = 400;
                res.end("Expected JSON object");
                return;
              }
              const target = path.resolve(
                process.cwd(),
                "public/global-locations.json"
              );
              fs.writeFileSync(
                target,
                `${JSON.stringify(parsed, null, 2)}\n`,
                "utf8"
              );
              res.statusCode = 204;
              res.end();
            } catch {
              res.statusCode = 500;
              res.end("Write failed");
            }
          });
        }
      );
    },
  };
}

export default defineConfig({
  base: "/fariel-map-viewer/",
  plugins: [react(), devSaveGlobalLocationsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
