# Changelog

## Unreleased

- Nothing yet.

## 2.0.0 - 2026-04-03

Diff baseline: `v1.6.5`

### Breaking Changes

- **HeroUI v3.** The package now depends on `@heroui/react ^3`. Consumers must upgrade their HeroUI installation. Key differences from v2:
  - No `HeroUIProvider` is required — remove it from your app root.
  - CSS is now imported with `@import "@heroui/styles"` instead of the v2 Tailwind plugin. Add this import to your own CSS entry file alongside `@import "tailwindcss"`.
  - Component APIs use the new compound-component pattern (e.g. `Popover.Content`, `Dropdown.Section`, `Toast.Provider`). If you were relying on internal HeroUI component structure for custom styling, review the v3 docs.
  - `EditorButtonProps.variant` and `color` props use HeroUI v3 values (`"ghost"`, `"primary"`, etc.) instead of v2 values.
- **`slots.dragHandleDropdown` requires a `Dropdown.Section` parent.** Custom items injected into the drag-handle dropdown must be wrapped in `<Dropdown.Section>` to render correctly.

### Added

- `slots.dragHandleDropdown` — inject custom items after the first section of the drag handle dropdown. Must be a `<Dropdown.Section>` node.

### Fixed

- "Default background" highlight color button now calls `unsetHighlight()` instead of calling `toggleHighlight({ color: 'hsl()' })`, which previously applied a yellow highlight.
- "Default text" color button now always calls `unsetColor()` regardless of active state.
- Text selection bubble menu now appears when selecting all content with Ctrl+A. ProseMirror's `AllSelection` is now handled alongside `TextSelection` in `isTextSelected` and `hasTextNodeInSelection`.

### Changed

- Replaced `hero.ts` Tailwind plugin with `@import "@heroui/styles"` in `index.css`. The plugin file has been removed.
- `Toast.Provider` replaces `ToastProvider` from HeroUI v2.
- Storybook decorator no longer wraps stories in `HeroUIProvider` (not needed in v3).

## 1.6.5 - 2026-03-24

Diff baseline: `v1.6.4`

### Breaking Changes

- None identified.

### Fixed

- `TextSelectionMenu` and `TableSelectionMenu` no longer appear in view mode when text is selected. Added `editor.isEditable` guard to both `shouldShow` callbacks.

## 1.6.4 - 2026-03-24

Diff baseline: `v1.6.3`

### Breaking Changes

- None identified.

### Fixed

- Fixed `NotFoundError: removeChild` crash caused by `TiptopDragHandle` unmounting while the `DragHandlePlugin` had already moved its DOM element to a separate wrapper outside React's tree. All three overlay components (`TiptopDragHandle`, `TextSelectionMenu`, `TableSelectionMenu`) are now kept permanently mounted for the lifetime of the editor — each handles its own visibility based on editor state.

## 1.6.3 - 2026-03-24

Diff baseline: `v1.6.2`

### Breaking Changes

- None identified.

### Fixed

- Fixed `NotFoundError: removeChild` crash when toggling between edit and view mode. Extracted `editable` from editor options so changing it no longer triggers editor recreation. `TextSelectionMenu` and `TableSelectionMenu` are now kept mounted at all times — `BubbleMenu` already suppresses itself when the editor is not editable, so there is no visual change in view mode.

## 1.6.2 - 2026-03-23

Diff baseline: `v1.6.1`

### Breaking Changes

- None identified.

### Fixed

- Removed wrapper `div` from `PopoverTrigger` in `ColorButtonMenu` and `MoreOptionsButtonMenu`, using `Button` directly as the trigger to fix popover rendering issues.

## 1.6.1 - 2026-03-23

Diff baseline: `v1.6.0`

### Breaking Changes

- None identified.

### Fixed

- Changed `z-1` to `z-2` on popover trigger wrappers in `ColorButtonMenu`, `LinkButtonMenu`, and `MoreOptionsButtonMenu` to fix selection menu popovers not appearing.

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
