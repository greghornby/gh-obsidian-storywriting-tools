# AGENTS.md

## Project
- Personal Obsidian.md plugin repo: `gh-obsidian-storywriting-tools`.
- Plugin id: `gh-storywriting-tools`.
- Runtime/tooling: Bun.
- Package type: CommonJS.
- Main source entry: `src/index.ts`.
- Bundled plugin output lives at repo root as `main.js`.

## Build Workflow
- Use Bun scripts from `package.json`.
- Build once:

```powershell
bun run build
```

- Typecheck without building:

```powershell
bun run typecheck
```

- Watch `src` and rebuild on changes:

```powershell
bun run watch
```

- `build.ts` uses `Bun.build()` with:
  - `entrypoints: ["./src/index.ts"]`
  - `outdir: "."`
  - `target: "node"`
  - `format: "cjs"`
  - `external: ["obsidian"]`
  - `naming.entry: "main.js"`
  - external sourcemaps enabled

## Watcher
- Watch mode is implemented inside `build.ts` using `node:fs.watch`.
- The watcher observes the `src` folder recursively.
- Rebuilds are debounced to avoid duplicate builds during rapid file saves.
- The watcher serializes builds; if a change happens during a build, it queues one follow-up rebuild.

## Vault Copy
- After each successful build, `build.ts` calls `copyBuildToVault()`.
- `copyBuildToVault.ts` reads `COPY_BUILD_TO_VAULT_ROOT` from `.env.local` / Bun env.
- The configured path must be an Obsidian vault root and contain `.obsidian`.
- Build artifacts are copied into:

```text
<COPY_BUILD_TO_VAULT_ROOT>/.obsidian/plugins/gh-storywriting-tools
```

- Copied files:
  - `main.js`
  - `manifest.json`
  - `styles.css`

## Environment
- Keep `.env.local` local. It should contain machine-specific vault paths.
- Do not hard-code personal vault paths into source files.
- If build or watch fails with `COPY_BUILD_TO_VAULT_ROOT not set`, create or update `.env.local`.

Example:

```dotenv
COPY_BUILD_TO_VAULT_ROOT=C:\Path\To\Obsidian\Vault
```

## Obsidian Plugin Notes
- Keep `obsidian` as an external dependency in the Bun build. Obsidian provides it at runtime.
- `manifest.json` must stay at repo root because it is copied directly into the plugin folder.
- `styles.css` must stay at repo root unless `copyBuildToVault.ts` is updated.
- For personal plugin changes, prefer small direct edits over broad scaffolding.

## Coding Preferences
- TypeScript and JavaScript: 2-space indentation.
- PowerShell examples: 2-space indentation.
- Keep generated output files such as `main.js` and `main.js.map` out of manual edits.
- Prefer editing `src/**`, `build.ts`, `copyBuildToVault.ts`, `manifest.json`, and `styles.css` as the source of truth.

## Verification
- For source changes, run:

```powershell
bun run typecheck
bun run build
```

- For build-script or packaging-only changes, run:

```powershell
bun run build
```

- For active plugin development, run:

```powershell
bun run watch
```

- If testing inside Obsidian, reload the plugin after the build copy completes.
