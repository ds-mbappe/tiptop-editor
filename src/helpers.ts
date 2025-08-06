import { Editor, isTextSelection } from '@tiptap/core';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { CodeBlock } from './extensions/CodeBlock';
import HorizontalRule from './extensions/HorizontalRule';
import type { SlashCommandGroupCommandsProps } from './types';
import type { Node } from '@tiptap/pm/model';

export const isTextSelected = (editor: Editor) => {
  const { state } = editor;
  const { selection, doc } = state;
  const { empty, from, to } = selection;

  // Sometime check for `empty` is not enough.
  // Doubleclick an empty paragraph returns a node size of 2.
  // So we check also for an empty text size.
  const isEmptyTextBlock = !doc.textBetween(from, to).length && isTextSelection(selection);
  const isSameNodeSelected = selection instanceof NodeSelection;

  return !(empty || isEmptyTextBlock || isSameNodeSelected);
}

export const hasTextNodeInSelection = (editor: Editor): boolean => {
  const { state } = editor;
  const { selection, doc } = state;

  if (!(selection instanceof TextSelection)) return false;
  
  let found = false;

  doc.nodesBetween(selection.from, selection.to, (node) => {
    if (node.isText) {
      found = true;
      return false;
    }
    return true;
  });

  return found;
};

export const isForbiddenNodeSelected = (editor: Editor) => {
  const forbiddenNodes = [
    CodeBlock.name,
    HorizontalRule.name
  ]

  return forbiddenNodes.some(type => editor.isActive(type));
}

export const canShowColorTransform = (editor: Editor) => {
  const { state } = editor;
  const { selection } = state;
  const allowedNodes = [
    'paragraph',
    'code',
    'heading',
    'blockquote',
    'taskList',
    'orderedList',
  ]

  if (!(selection instanceof NodeSelection)) return;

  const node = selection.node;

  if (!node) return;
  
  return allowedNodes.includes(node.type.name) && node.textContent
}

export const canShowNodeTransform = (editor: Editor) => {
  const { state } = editor;
  const { selection } = state;
  const forbiddenNodes = [
    'horizontalRule'
  ]

  if (!(selection instanceof NodeSelection)) return;

  const node = selection.node;

  if (!node) return;

  return !forbiddenNodes.includes(node.type.name)
}

export const hasAtLeastOneMark = (editor: Editor) => {
  const { state } = editor;
  const { selection } = state;

  if (!(selection instanceof NodeSelection)) return;

  const node = selection.node;

  if (!node) return;

  let found: boolean = false;

  if (node.marks.length) {
    return true
  }

  node.descendants((child) => {
    if (child.marks?.length) {
      found = true
      return false
    }
    return true
  })

  return found;
}

export const nodeHasTextContent = (editor: Editor) => {
  const { state } = editor;
  const { selection } = state;

  if (!(selection instanceof NodeSelection)) return;

  const node = selection.node;

  if (!node) return;

  return node.textContent.trim().length > 0;
}

export const duplicateNode = (editor: Editor) => {
  const { state } = editor
  const { selection, doc } = state
  
  const sel = selection instanceof NodeSelection
    ? selection
    : NodeSelection.create(doc, selection.from)
  
  const node = sel.node
  const pos = sel.from
  
  if (!node) return

  const nodeJSON = node.toJSON()
  
  editor
    .chain()
    .focus()
    .command(({ tr, dispatch, state }) => {
      const insertPos = pos + node.nodeSize
      const newNode = state.schema.nodeFromJSON(nodeJSON)
      
      tr.insert(insertPos, newNode)
      
      if (dispatch) {
        dispatch(tr)
      }
      return true
    })
    .run()
  
  // We update the state of the editor, because there is a bug where the drag handle
  // gets broken after duplicating.
  setTimeout(() => {
    editor.view.updateState(editor.state)
    
    const newPos = pos + node.nodeSize
    const newSelection = NodeSelection.create(editor.state.doc, newPos)
    editor.view.dispatch(editor.state.tr.setSelection(newSelection))
  }, 0)
}

export const copyNodeTextContent = (editor: Editor) => {
  const { state } = editor;
  const { selection } = state;

  if (!(selection instanceof NodeSelection)) return;

  const node = selection.node;

  if (!node) return;

  const textContent = node.textContent;

  if (!textContent) return;

  navigator.clipboard.writeText(textContent).catch((err) => {
    console.error('Failed to copy to clipboard:', err);
  });
}

export const deleteNode = (editor: Editor) => {
  const { state } = editor
  const { selection } = state

  if (!(selection instanceof NodeSelection)) return;

  const { from, to } = selection

  editor.chain().focus().deleteRange({ from, to }).run()
  editor.view.focus()
}

export const removeAllFormatting = (editor: Editor) => {
  const { state } = editor
  const { selection } = state
  
  if (!(selection instanceof NodeSelection)) return;
  
  const node = selection.node
  const pos = selection.from
  
  if (!node) return
  
  const plainText = node.textContent
  
  if (!plainText.trim()) {
    editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        const paragraph = state.schema.nodes.paragraph.create()
        tr.replaceWith(pos, pos + node.nodeSize, paragraph)
        
        if (dispatch) dispatch(tr)
        return true
      })
      .run()
    return
  }
  
  editor
    .chain()
    .focus()
    .command(({ tr, dispatch, state }) => {
      const textNode = state.schema.text(plainText)
      const paragraph = state.schema.nodes.paragraph.create(null, textNode)
      
      tr.replaceWith(pos, pos + node.nodeSize, paragraph)
      
      if (dispatch) dispatch(tr)
      return true
    })
    .run()
  
  setTimeout(() => {
    editor.view.updateState(editor.state)
    
    try {
      const newSelection = NodeSelection.create(editor.state.doc, pos)
      editor.view.dispatch(editor.state.tr.setSelection(newSelection))
    } catch (e) {
      editor.commands.setTextSelection(pos)
    }
  }, 0)
}

export const transformNodeToAlternative = (editor: Editor, targetOption: SlashCommandGroupCommandsProps): void => {
  const { state } = editor
  const { selection } = state
  
  // Helper function to apply transformation
  const applyTransformation = (): void => {
    const nodeMap: Record<string, () => boolean> = {
      paragraph: () => editor.chain().focus().setNode('paragraph').run(),
      heading1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      heading2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      heading3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      blockquote: () => editor.chain().focus().toggleBlockquote().run(),
      codeBlock: () => editor.chain().focus().toggleCodeBlock().run(),
      bulletList: () => editor.chain().focus().toggleBulletList().run(),
      orderedList: () => editor.chain().focus().toggleOrderedList().run(),
      taskList: () => editor.chain().focus().toggleTaskList().run(),
      // Horizontal rule - insert instead of transform
      horizontalRule: () => {
        // First clear the current node content, then insert HR
        const { from, to } = selection
        return editor.chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent({ type: 'horizontalRule' })
          .run()
      },
    }
    
    const transform = nodeMap[targetOption.key]
    if (transform) transform()
  }
  
  if (selection instanceof NodeSelection) {
    const node: Node | null = selection.node
    const pos: number = selection.from
    
    if (!node) return
    
    // Special handling for horizontal rule - it replaces the entire node
    if (targetOption.key === 'horizontalRule') {
      editor.chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .insertContent({ type: 'horizontalRule' })
        .run()
      return
    }
    
    // Select the content INSIDE the node, not the entire node
    const contentStart: number = pos + 1
    const contentEnd: number = pos + node.nodeSize - 1
    
    // Set text selection to the content inside the node
    editor.commands.setTextSelection({ from: contentStart, to: contentEnd })
    
    applyTransformation()
    
    if (!['bulletList', 'orderedList', 'taskList'].includes(targetOption.key)) {
      setTimeout(() => {
        try {
          const newSelection = NodeSelection.create(editor.state.doc, pos)
          editor.view.dispatch(editor.state.tr.setSelection(newSelection))
        } catch (e) {
          editor.commands.setTextSelection(pos)
        }
      }, 0)
    }
  } else {
    applyTransformation()
  }
}

export const addOrUpdateLink = (editor: Editor, url: string) => {
  if (!editor) return;

  if (url === null) {
    return
  }

  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

export const unsetLink = (editor: Editor) => {
  if (!editor) return;
  
  const previousUrl = editor.getAttributes('link')?.href

  if (previousUrl) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
  }
}