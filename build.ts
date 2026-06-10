import type { BuildConfig } from "bun";
import { watch } from "node:fs";
import { copyBuildToVault } from "./copyBuildToVault";
import picomatch from "picomatch";

const config: BuildConfig = {
  // 1. Entry points for the application (Supports arrays, objects, or globs)
  entrypoints: ["./src/index.ts"],

  // Obsidian provides this module at runtime; the npm package is for types.
  external: ["obsidian"],

  // 2. Output directory for bundled assets
  outdir: ".",

  // 3. Bundling mode ("browser", "bun", or "node")
  target: "node",
  format: "cjs",

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

async function build(firstRun: boolean = false) {
  // Execute the build pipeline
  const result = await Bun.build(config);

  if (!result.success) {
    console.error("Build failed:", result.logs);
    process.exit(1);
  }

  if (firstRun) {
    console.log("Build succeeded! Generated files:");
    for (const artifact of result.outputs) {
      console.log(`- ${artifact.path} (${artifact.size} bytes)`);
    }
  } else {
    console.log("Rebuild succeeded!");
  }

  copyBuildToVault();
}

const isWatch = process.argv.includes("--watch");

await build(true);

if (isWatch) {
  let timer: Timer | undefined;
  let building = false;
  let pending = false;

  const rebuild = async () => {
    if (building) {
      pending = true;
      return;
    }

    building = true;

    try {
      await build();
    } finally {
      building = false;

      if (pending) {
        pending = false;
        await rebuild();
      }
    }
  };

  const matchFileGlobs = ["src/**/*", "styles.css"];
  const matchFile = picomatch(matchFileGlobs);

  watch(
    import.meta.dir,
    { recursive: true },
    (_event, _filename) => {
      const filename = _filename?.replaceAll("\\", "/");
      if (!filename) return;
      if (!matchFile(filename)) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        console.log(`Changed: ${filename}`);
        rebuild();
      }, 100);
    },
  );

  console.log(`Watching ${JSON.stringify(matchFileGlobs)}...`);
}