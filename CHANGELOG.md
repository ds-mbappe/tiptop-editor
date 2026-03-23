# Changelog

## Unreleased

- Nothing yet.

## 1.6.0 - 2026-03-23

Diff baseline: `v1.5.0`

### Breaking Changes

- None identified.

### Fixed

- Added `z-1` to popover trigger wrappers in `ColorButtonMenu`, `LinkButtonMenu`, and `MoreOptionsButtonMenu` to fix selection menu popovers rendering behind editor content.

## 1.5.0 - 2026-03-23

Diff baseline: `v1.4.0`

### Breaking Changes

- None identified.

### Fixed

- Wrapped toolbar buttons in a container div in `ColorButtonMenu`, `LinkButtonMenu`, and `MoreOptionsButtonMenu` to fix buttons not going behind content when scrolling.

## 1.4.0 - 2026-03-22

Diff baseline: `v1.3.0`

### Breaking Changes

- None identified.

### Changed

- Hide drag handle and text/table selection menus when the editor is in read-only mode (`editable: false`).

## 1.3.0 - 2026-03-02

Diff baseline: `v1.2.0`

### Breaking Changes

- None identified.

### Added

- Added `editorOptions.extraExtensions` so consumers can append custom Tiptap extensions without replacing the built-in editor setup.
- Added a `slots` API for injecting custom React UI above or below the editor and into text/table selection menus.
- Added `TiptopEditorContext` and `useTiptopEditor()` for slotted components that need access to the current editor instance.
- Added duplicate-extension detection for `extraExtensions`, with both a console warning and a toast notification when a consumer re-registers a built-in extension name.
- Added Storybook coverage for the slot-based customization path.

### Changed

- Refactored `TiptopEditor` internals to separate default extension creation, slot rendering, and duplicate-extension warnings into dedicated editor helpers.
- Updated README documentation to cover `extraExtensions`, slots, and the editor context hook.

## 1.2.0 - 2026-03-02

Diff baseline: `v1.1.0`

### Breaking Changes

- None identified.

### Added

- Added Storybook support for the package with a dedicated `TiptopEditor` story.
- Added automated Storybook deployment to GitHub Pages.
- Added imperative editor event methods to the component ref:
  - `on`
  - `off`
  - `once`
- Added README documentation for binding to Tiptap editor events through the component ref.

### Changed

- Reorganized `src/components` into `editor`, `menus`, and `ui` groups to make future feature work easier to maintain.
- Updated Storybook preview layout so the drag handle has enough left gutter in the iframe.

### Fixed

- Fixed the `TiptopEditor` ref handle to return the actual editor instance from `getEditor()`.
- Replaced the brittle relative ProseMirror CSS import with the package import form.

### Internal

- Added release workflow support for generating GitHub Releases from `CHANGELOG.md`.
- Made the npm publish workflow idempotent for reruns when a version is already published.

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
