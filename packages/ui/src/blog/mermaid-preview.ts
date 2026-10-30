import {Extension} from '@tiptap/react'
import {NodeSelection, Plugin, PluginKey} from '@tiptap/pm/state'
import {Decoration, DecorationSet} from '@tiptap/pm/view'

import {renderMermaid} from './mermaid-diagram'

/**
 * A ```mermaid code block shows as its diagram only; the source is edited in a dialog.
 *
 * The code block stays in the document untouched (so the JSON and markdown are the same
 * as for any code block). Two decorations dress it for the editor: the node itself is
 * hidden, and a widget with the drawn diagram stands in its place. Clicking the widget
 * selects the block — drawn with the same outline as a selected image — and asks the
 * editor to open the source dialog (`onEdit`, given the block's position).
 *
 * An empty block, or a source that does not parse, still gets a widget (the parser's
 * message), so there is always something to click: a hidden block with nothing in its
 * place could not be reached again.
 */
type Options = {
  /** Opens the source dialog for the block at `pos`. */
  onEdit: (pos: number) => void
  /** Opens the full-size viewer (with zoom) for the block at `pos`. */
  onPreview: (pos: number) => void
  labels: {edit: string; preview: string}
}

/** Where the last click landed inside a diagram, so the options appear at the cursor. */
let lastClick = {x: 0, y: 0}

export const MermaidPreview = Extension.create<Options>({
  name: 'mermaidPreview',

  addOptions() {
    return {
      onEdit: () => undefined,
      onPreview: () => undefined,
      labels: {edit: 'Edit', preview: 'Preview'},
    }
  },

  addProseMirrorPlugins() {
    const {onEdit, onPreview, labels} = this.options
    return [
      new Plugin({
        key: new PluginKey('mermaidPreview'),
        props: {
          decorations(state) {
            const found: Decoration[] = []
            const dark = document.documentElement.classList.contains('dark')
            const {selection} = state
            state.doc.descendants((node, pos) => {
              if (
                node.type.name !== 'codeBlock' ||
                node.attrs.language !== 'mermaid'
              )
                return
              const end = pos + node.nodeSize
              const chart = node.textContent
              const selected =
                selection instanceof NodeSelection && selection.from === pos
              found.push(
                Decoration.node(pos, end, {class: 'post-prose-mermaid-source'}),
              )
              found.push(
                Decoration.widget(
                  end,
                  (view, getPos) => {
                    const at = () => (getPos() ?? end) - node.nodeSize
                    return widget(chart, dark, selected && lastClick, labels, {
                      select: () => {
                        view.dispatch(
                          view.state.tr.setSelection(
                            NodeSelection.create(view.state.doc, at()),
                          ),
                        )
                        view.focus()
                      },
                      edit: () => onEdit(at()),
                      preview: () => onPreview(at()),
                    })
                  },
                  {
                    side: 1,
                    key: `mermaid:${dark}:${selected ? `${lastClick.x},${lastClick.y}` : 'no'}:${chart}`,
                    ignoreSelection: true,
                    // The widget handles its own clicks. Left to ProseMirror, the mousedown
                    // moves the selection first, the widget is rebuilt (its key carries the
                    // selection) and the click lands on a DOM node that no longer exists —
                    // so neither the options nor the dialogs ever opened.
                    stopEvent: () => true,
                  },
                ),
              )
            })
            return DecorationSet.create(state.doc, found)
          },
        },
      }),
    ]
  },
})

// Static lucide glyphs (`eye`, `pencil`): the widget is plain DOM, outside React.
const EYE =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>'
const PENCIL =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>'

function option(
  icon: string,
  label: string,
  run: () => void,
): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'post-prose-mermaid-option'
  button.innerHTML = `${icon}<span></span>`
  button.lastElementChild!.textContent = label
  button.addEventListener('click', (event) => {
    event.stopPropagation()
    run()
  })
  return button
}

function widget(
  chart: string,
  dark: boolean,
  picked: false | {x: number; y: number},
  labels: Options['labels'],
  actions: {select: () => void; edit: () => void; preview: () => void},
): HTMLElement {
  const dom = document.createElement('div')
  dom.contentEditable = 'false'
  dom.className = `post-prose-mermaid post-prose-mermaid-widget${picked ? ' is-selected' : ''}`
  dom.addEventListener('click', (event) => {
    const box = dom.getBoundingClientRect()
    lastClick = {
      x: Math.round(event.clientX - box.left),
      y: Math.round(event.clientY - box.top),
    }
    actions.select()
  })
  if (picked) {
    // Two options at the cursor: a full-size view with zoom, and the source as text.
    const bar = document.createElement('div')
    bar.className = 'post-prose-mermaid-options'
    bar.style.left = `${picked.x}px`
    bar.style.top = `${picked.y}px`
    bar.append(
      option(EYE, labels.preview, actions.preview),
      option(PENCIL, labels.edit, actions.edit),
    )
    dom.append(bar)
  }
  if (!chart.trim()) {
    dom.prepend('mermaid')
    return dom
  }
  const picture = document.createElement('div')
  picture.className = 'post-prose-mermaid-picture'
  dom.prepend(picture)
  renderMermaid(chart, dark).then(
    (svg) => {
      picture.innerHTML = svg
    },
    (error: unknown) => {
      dom.classList.add('is-error')
      picture.textContent =
        error instanceof Error
          ? error.message.split('\n')[0]
          : 'Invalid diagram'
    },
  )
  return dom
}
