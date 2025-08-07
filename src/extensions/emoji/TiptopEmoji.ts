import Suggestion from "@tiptap/suggestion"
import Emoji, { gitHubEmojis } from "@tiptap/extension-emoji"
import TiptopEmojiSuggestion from "./TiptopEmojiSuggestion"

const TiptopEmoji = Emoji.configure({
  emojis: gitHubEmojis,
  enableEmoticons: true,
  forceFallbackImages: false,
  suggestion: TiptopEmojiSuggestion
}).extend({
  addProseMirrorPlugins() {
  return [
    Suggestion({
    editor: this.editor,
    ...this.options.suggestion,
    decorationClass: 'tiptop-slash-highlight'
    }),
  ]
  },
});

export default TiptopEmoji;