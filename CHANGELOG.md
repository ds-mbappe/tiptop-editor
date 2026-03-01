# Changelog

## Unreleased

- Nothing yet.

## 1.1.0 - 2026-03-01

Diff baseline: `v1.0.18`

### Breaking Changes

- None identified.

### Added

- Added table support through `TableKit`, including insert, row and column actions, header toggles, split cell, and merge cells.
- Added table-specific selection controls so table actions are available from the editor UI.
- Added `disableDefaultContainer` to `editorOptions` to remove the default `Card` wrapper and editor padding.
- Added `showDragHandle` to `editorOptions` to let consumers disable the drag handle UI.
- Added documentation for built-in table, emoji, and image upload features.
- Added support for more flexible image upload response extraction via `imgUploadResponseKey`.

### Changed

- `imgUploadResponseKey` now accepts:
  - a top-level key such as `'url'`
  - a nested path such as `'data.url'`
  - a path array such as `['data', 'url']`
  - a custom resolver function
- Improved slash-command typing so `SlashCommand.configure({ suggestion })` is type-safe with the current Tiptap v3 setup.
- Updated editor styling for tables, including resize cursor behavior and selected-cell visuals.
- Updated README usage guidance and image upload setup examples.

### Fixed

- Fixed the slash-command suggestion typing mismatch in `TiptopEditor`.
- Fixed table selection controls so they appear for multi-cell selections, which allows merge actions to be triggered from the UI.
- Stopped versioning `tsconfig.app.tsbuildinfo`.

### Internal

- Added `@tiptap/extension-table` to dependencies.
