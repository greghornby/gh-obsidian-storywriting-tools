import path from "path";
import fs from "fs";

const COPY_BUILD_TO_VAULT_ROOT = Bun.env.COPY_BUILD_TO_VAULT_ROOT;
if (!COPY_BUILD_TO_VAULT_ROOT) {
  throw new Error(`Environment variable COPY_BUILD_TO_VAULT_ROOT not set!`);
}
if (!fs.existsSync(COPY_BUILD_TO_VAULT_ROOT)) {
  throw new Error(`The directory ${COPY_BUILD_TO_VAULT_ROOT} does not exist!`);
}
if (!fs.existsSync(path.join(COPY_BUILD_TO_VAULT_ROOT, ".obsidian"))) {
  throw new Error(`The directory ${COPY_BUILD_TO_VAULT_ROOT} does not appear to be an obsidan vault! (.obsidian folder not found)`);
}
const COPY_BUILD_PLUGIN_FOLDER = path.join(COPY_BUILD_TO_VAULT_ROOT, ".obsidian", "plugins", "gh-storywriting-tools")

const thisDir = import.meta.dirname;

const filesToCopy = [
  "main.js",
  "manifest.json",
  "styles.css"
].map(f => ({
  fileToCopy: path.join(thisDir, f),
  toLocation: path.join(COPY_BUILD_PLUGIN_FOLDER, f)
}));

fs.mkdirSync(COPY_BUILD_PLUGIN_FOLDER, {recursive: true});
for (const fileMeta of filesToCopy) {
  console.log("Copying", fileMeta);
  fs.copyFileSync(fileMeta.fileToCopy, fileMeta.toLocation)
}