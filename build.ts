import type { BuildConfig } from "bun";

const config: BuildConfig = {
  // 1. Entry points for the application (Supports arrays, objects, or globs)
  entrypoints: ["./src/index.ts"],

  // Obsidian provides this module at runtime; the npm package is for types.
  external: ["obsidian"],

  // 2. Output directory for bundled assets
  outdir: ".",

  // 3. Bundling mode ("browser", "bun", or "node")
  target: "node",

  // 4. Code optimization flags
  minify: false,       // Shrinks file size
  sourcemap: "external", // Generates .js.map files ("inline", "external", or "none")

  // 6. Custom naming formats for output files
  naming: {
    entry: "main.js", // Output pattern for your primary files
    // chunk: "[hash].chunk.js", // Format for shared splitting chunks
    // asset: "[name]-[hash].[ext]" // Format for media or styles
  },

  // 7. Environment variable handling ("inline" or "system")
  define: {
    "process.env.API_URL": JSON.stringify(process.env.API_URL || "https://example.com"),
  }
};

// Execute the build pipeline
const result = await Bun.build(config);

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}

console.log("Build succeeded! Generated files:");
for (const artifact of result.outputs) {
  console.log(`- ${artifact.path} (${artifact.size} bytes)`);
}
