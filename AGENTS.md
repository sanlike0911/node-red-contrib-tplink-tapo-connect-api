# Repository Guidelines

## Project Structure & Module Organization
- `src/nodes/` contains TypeScript sources for each Node-RED node plus shared utilities in `tplink-tapo-connect/`.
- Node editor templates and assets live alongside TS sources (`*.html`, `icons/`, `locales/`).
- Transpiled output is synced to `dist/` and mirrored to `nodes/`; runtime fixtures for local Node-RED live in `data/my-node/`.
- Example flows and docs are under `examples/` and `README.md`; generated assets should not be edited directly.

## Build, Test, and Development Commands
- `npm run build`: cleans, compiles TypeScript, copies assets, and installs the local test node into `data/`.
- `npm run tsc`: compile TypeScript only; useful for quick type checking during development.
- `npm test`: runs Mocha specs in `src/nodes/test/*_spec.js` via Node-RED test helper.
- `npm run start`: launches Node-RED on port 1880 using the local `data/` workspace; use after `npm run build`.
- `npm run start:debug`: same as start but opens an inspector on `0.0.0.0:9229`.

## Coding Style & Naming Conventions
- TypeScript sources use 4-space indentation, single quotes for Node-RED registration IDs, and PascalCase for exported types.
- Node IDs follow the `tplink_*` pattern; align new nodes with existing filenames (`tplink_status.ts/html`).
- Prefer TypeScript-first authoring; do not edit output in `dist/` or `nodes/`.
- Run `npm run tsc` before commit to maintain strict typings defined in `tsconfig.json`.

## Testing Guidelines
- Specs live in `src/nodes/test/` and follow the `_spec.js` suffix; mirror this naming for new coverage.
- Use Mocha with `node-red-node-test-helper` for node life-cycle tests; seed flows via fixtures in `data/`.
- Aim to cover both success and error paths, validating emitted messages and status updates.

## Commit & Pull Request Guidelines
- Follow conventional commits observed in history (`build(deps): ...`, `feat(scope): ...`); scope should match node or package touched.
- Keep commits focused; include configuration changes and generated code in the same commit only when reproducible via documented scripts.
- Pull requests should describe the change, reference issues, list affected nodes, and attach screenshots for UI tweaks (palette labels, status text).
- Confirm `npm test` and `npm run build` succeed locally before requesting review; mention any skipped steps in the PR description.

## Security & Configuration Tips
- Do not commit credentials; use `.env` loaded via `dotenv` when manual secrets are needed for local tests.
- Verify new dependencies are compatible with Node 18+ as declared in `package.json` engines.
