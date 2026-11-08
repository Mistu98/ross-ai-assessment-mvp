import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Serve the repository's existing JSON without moving or rewriting it. Do not
// create a substitute source file when repository access is unavailable.
function conceptSource() {
  const source = resolve("data/concepts.json");
  return {
    name: "repository-concept-source",
    configureServer(server) {
      server.middlewares.use(
        "/data/concepts.json",
        (_request, response, next) => {
          if (!existsSync(source)) return next();
          response.setHeader("Content-Type", "application/json");
          response.end(readFileSync(source));
        },
      );
    },
    generateBundle() {
      if (existsSync(source))
        this.emitFile({
          type: "asset",
          fileName: "data/concepts.json",
          source: readFileSync(source),
        });
    },
  };
}
export default defineConfig({
  plugins: [react(), tailwindcss(), conceptSource()],
});
