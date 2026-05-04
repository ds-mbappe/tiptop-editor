# Release Process

This document describes how to ship a new version of `tiptop-editor`. It is written for both humans and LLMs — follow the steps in order.

## Overview

Pushing a `v*.*.*` git tag triggers CI (`.github/workflows/release.yml`) which:
1. Builds the package
2. Publishes to npm (skipped if the version already exists there)
3. Creates a GitHub Release with notes extracted from `CHANGELOG.md`

There is nothing else to run manually after the tag is pushed.

---

## Step-by-step

### 1. Decide the version bump

| Change type | Bump |
|-------------|------|
| Bug fixes, internal refactors only | patch (`x.y.Z`) |
| New features, new exported API | minor (`x.Y.0`) |
| Breaking changes | major (`X.0.0`) |

### 2. Update `CHANGELOG.md`

Move the `## Unreleased` section to a new dated heading, and reset Unreleased:

```md
## Unreleased

- Nothing yet.

## X.Y.Z - YYYY-MM-DD

Diff baseline: `vA.B.C`      ← previous released tag

### Breaking Changes

- None identified.            ← or list them

### Added

- ...

### Fixed

- ...

### Changed

- ...
```

The CI script (`scripts/extract-changelog.mjs`) extracts the body of the `## X.Y.Z` section verbatim and posts it as the GitHub Release body. Every `### ...` sub-heading and bullet in that section will appear in the release notes, so write them clearly.

### 3. Update `package.json`

Set `"version"` to the new version string (e.g. `"2.3.0"`).

The README does **not** need updating for internal bug fixes. Update it when there is a new public API, new option, or new usage pattern.

### 4. Commit

Stage `CHANGELOG.md`, `package.json`, and any other changed files, then commit:

```
release: vX.Y.Z - <one-line summary>
```

### 5. Tag

```bash
git tag vX.Y.Z
```

### 6. Push branch and tag

```bash
git push origin master
git push origin vX.Y.Z
```

CI starts automatically. The npm publish and the GitHub Release are created within a few minutes.

---

## Checklist for LLMs

When asked to "prepare and ship a release", do the following in order:

1. Run `git status` and `git diff HEAD --stat` to understand what changed since the last tag.
2. Decide the version bump from the table above.
3. Edit `CHANGELOG.md`: move Unreleased → new version section with today's date; write accurate Added / Fixed / Changed bullets.
4. Edit `package.json`: bump `"version"`.
5. Update `README.md` only if there is a new public API or usage pattern.
6. Commit all modified files with message `release: vX.Y.Z - <summary>`.
7. Run `git tag vX.Y.Z`.
8. Run `git push origin master && git push origin vX.Y.Z`.
9. Confirm the push succeeded. CI handles npm + GitHub release automatically — do not run `npm publish` manually.
