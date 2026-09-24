import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    dts({
      // Emits dist/server/*.d.ts (entryRoot "src" preserves the "server/"
      // prefix) so it never collides with the browser build's dist/index.d.ts.
      insertTypesEntry: true,
      include: ["src/server/**/*.ts"],
      entryRoot: "src",
      outDir: "dist",
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/server/index.ts"),
      name: "BiReportKitServer",
      fileName: (format) => `server.${format === "es" ? "js" : "cjs"}`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      // pg is Node-only (native bindings for some auth methods) \u2014 never bundle it.
      external: ["pg"],
    },
    outDir: "dist",
    // The browser build (vite.config.ts) runs first and empties dist/;
    // this one must not wipe those files out again.
    emptyOutDir: false,
    sourcemap: false,
  },
});
