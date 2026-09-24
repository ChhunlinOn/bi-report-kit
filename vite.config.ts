import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ["src"],
      exclude: ["src/**/*.stories.tsx", "src/**/*.test.tsx"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "BiReportKit",
      fileName: (format) => `bi-report-kit.${format === "es" ? "js" : "cjs"}`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      // Never bundle React itself \u2014 the host app (React/Next.js) supplies it.
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        // one predictable CSS file name regardless of internal chunk hashing.
        // Rollup's asset-info shape changed across versions (singular `name`
        // vs an array `names`) \u2014 check both so this keeps working either way.
        assetFileNames: (info) => {
          const names = "names" in info && Array.isArray((info as { names?: string[] }).names)
            ? (info as { names: string[] }).names
            : [info.name ?? ""];
          return names.some((n) => n?.endsWith(".css")) ? "style.css" : "assets/[name]-[hash][extname]";
        },
      },
    },
    sourcemap: false,
    emptyOutDir: true,
  },
});
