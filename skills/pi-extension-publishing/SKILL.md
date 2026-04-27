---
name: pi-extension-publishing
description: Prepare standalone Pi extensions for GitHub and npm publishing. Use when asked to package a Pi extension as a public npm package, clean up package metadata, add release/versioning flow, create or push extension repos, test install-from-git or install-from-npm, choose scoped package names, or publish new Pi extension packages.
---

Prepare each extension as an independent repo unless the user explicitly wants a monorepo.

Before publishing:
- Confirm the code is actually publishable. Do not publish copied or forked extensions unless license and ownership are clear.
- Prefer local path installs first during development: `pi install ~/path/to/package`.
- Prefer scoped npm names for personal packages, e.g. `@owner/pi-thing`.
- Keep Pi runtime packages in `peerDependencies`. Use `devDependencies` only for local typechecking and authoring.
- Assume Pi loads `src/index.ts` directly unless the package clearly needs a build step.

Set up `package.json` with at least:
- `name`, `version`, `description`, `type`
- `author`, `license`, `keywords`
- `files` including runtime sources plus `README.md` and `LICENSE`
- `repository`, `homepage`, `bugs`
- `publishConfig.access: "public"` for public scoped packages
- `pi.extensions` pointing at the extension entry file
- scripts:
  - `check`: `tsc --noEmit -p tsconfig.json`
  - `prepublishOnly`: `npm run check`
  - `release:patch`: `npm run check && npm version patch -m "chore(release): %s"`
  - `release:minor`: `npm run check && npm version minor -m "chore(release): %s"`
  - `release:major`: `npm run check && npm version major -m "chore(release): %s"`
  - `publish:release`: `npm publish`

README minimum:
- what the extension does
- local install command
- npm install command
- release commands
- short note that `npm version` updates `package.json`, updates `package-lock.json`, creates a release commit, and creates a `vX.Y.Z` git tag

Versioning:
- Use independent semver per repo.
- Start new public packages at `0.1.0` unless the user wants `1.0.0` immediately.
- Use `patch` for fixes, `minor` for backwards-compatible features, `major` for breaking changes.
- Let `npm version` be the source of truth instead of manually editing `package.json` and manually tagging.

GitHub flow:
1. Run `npm install` if needed so `package-lock.json` matches metadata changes.
2. Run `npm run check`.
3. Commit only the files changed for that package.
4. Create the GitHub repo.
5. Push a review branch first if the user wants to inspect before merging.
6. After approval, push or merge to `main` and delete the review branch.

Release flow:
1. `npm run check`
2. `npm run release:patch` or `npm run release:minor` or `npm run release:major`
3. `git push origin HEAD --follow-tags`
4. `npm run publish:release`
5. Verify install:
   - GitHub: `pi install git:github.com/<owner>/<repo>`
   - npm: `pi install npm:@owner/package-name`

If the user wants a durable reminder, put the release flow in both places:
- each package README
- this global skill
