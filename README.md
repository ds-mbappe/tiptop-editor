# 📝 Tiptop Editor

A Notion-like rich text editor built with [Tiptap v3](https://tiptap.dev/), [HeroUI](https://heroui.dev/), [Tailwind v4](https://https://tailwindcss.com) packaged as a plug-and-play React component.
Inspired from [TipTap Notion-like](https://tiptap.dev/docs/ui-components/templates/notion-like-editor).

![npm version](https://img.shields.io/npm/v/tiptop-editor.svg)
![bundle size](https://img.shields.io/bundlephobia/minzip/tiptop-editor)
![license](https://img.shields.io/npm/l/tiptop-editor)

---

## ✨ Features

- Built on **Tiptap v3** — a powerful, headless rich-text editor
- Styled with **HeroUI** + **Tailwind**
- Fully typed with **TypeScript**
- Ready to embed in any React app
- Designed for **Notion-like UX**


https://github.com/user-attachments/assets/cb7d907d-bae0-4b3b-b6e7-8493180afd75


---

## ⚙️ Installation
```bash
npm install tiptop-editor
```

## 🚀 Usage

**Import the component in your app**
  ```tsx
  import { TiptopEditor } from "tiptop-editor";

  <TiptopEditor />
  ```
**Add the CSS code to your app**
For the package to behave like it should, you have to import the compiled CSS file. Add this line in your main css file, or import it directly in the component file that's going to host the **TiptopEditor**.
- In your main css file
  ```css
  @import '../node_modules/tiptop-editor/dist/tiptop-editor.css';
- In any component file
  ```tsx
  import 'tiptop-editor/dist/tiptop-editor.css'
## 🎨 Example
The Tiptop component takes as props all the props from the `UseEditorOptions` from [*@tiptap/react*](https://www.npmjs.com/package/@tiptap/react), except the `extensions` prop.
*Why only that prop, you ask ? Well, since this package is intended to *replicate* the Notion-like style with all their blocks/extensions and plug-and-play, as of now, I have not allowed users to pass their own extensions. But that can change in the future, just not now.*
Anyway, to use the package, just pass your props to `editorOptions` and you're good to go. Customize the Tiptop component will the props you want, as if you were using *EditorContent and passing props to the editor*.
```tsx
<TiptopEditor editorOptions={{
    immediatelyRender: false
    content: '<p>I am the Tiptop Editor</p>'
    ... // Other props
  }}
/>
```


##### Of course, I will continue to improve this project over time, as I have many more ideas (more extensions, more customizations, etc..)
##### Emoji Extension, Image extension, and more coming in next updates 🏃‍♂ ...

I will also document the Changelogs and releases, as well as continue to update this Readme with relevant information.

*If you have any suggestions/recommendations to improve this project, any feedback is much appreciated (PRs welcome) !*
*I also encourage you to open up *Issues* if you find releveant bugs inside the package.*

**Thank you, and Happy Coding !**