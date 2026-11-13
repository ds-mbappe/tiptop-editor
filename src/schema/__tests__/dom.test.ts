// @vitest-environment jsdom
// The pure HTML parser must build the same tree as a browser (jsdom here)
// for the markup notes contain.
import { describe, expect, it } from 'vitest'
import { normalizeColor, parseHTMLFragment, serializeChildren } from '../html/dom'

// Comments are dropped by the pure parser: ProseMirror ignores them anyway.
const browser = (html: string) =>
  new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body.innerHTML.replace(/<!--[\s\S]*?-->/g, '')

const CASES: [string, string][] = [
  ['paragraphs', '<p>a</p><p>b <strong>c</strong></p>'],
  ['entities', '<p>a &amp; &lt;b&gt; &quot;q&quot; &#39; &nbsp; &eacute; &#x1F600; &unknown; & alone</p>'],
  ['implied </p>', '<p>one<p>two<div>three</div>'],
  ['implied </li>', '<ul><li>a<li>b<ul><li>c</ul><li>d</ul>'],
  ['void and self-closing', '<p>a<br>b<br/>c<img src="x.png"/>d<hr></p>'],
  ['stray end tags', '<p>a</span>b</div></p></p>c'],
  ['heading closes heading', '<h1>a<h2>b</h2>'],
  ['table without tbody', '<table><tr><td>a<td>b</tr><tr><th>c</table>'],
  ['tiptop table', '<table style="min-width: 50px"><colgroup><col style="min-width: 25px"><col style="min-width: 25px"></colgroup><tbody><tr><td colspan="1" rowspan="1"><p>a</p></td><td colspan="1" rowspan="1"><p>b</p></td></tr></tbody></table>'],
  ['task list', '<ul data-type="taskList"><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked="checked"><span></span></label><div><p>x</p></div></li></ul>'],
  ['code with markup-like text', '<pre><code class="language-js">if (a &lt; b) { x = "&amp;" }\n  y</code></pre>'],
  ['raw text', '<iframe src="https://www.youtube.com/embed/abc" allowfullscreen=""></iframe><p>t</p><script>if (a<b) x()</script>'],
  ['comments and doctype', '<!DOCTYPE html><!-- c --><p>a<!-- inner --></p>'],
  ['attributes', '<a href=https://x.y/?a=1&amp;b=2 target=\'_blank\' data-x data-y="1">l</a>'],
  ['uppercase and mixed', '<P CLASS="x">a</P><Div Data-Type="draggable-item"><P>b</P></Div>'],
  ['legacy draggable', '<div data-type="draggable-item"><p>in drag</p></div><div data-type="draggable-item"><img src="https://x/b.png" data-width="50%" data-align="center"></div>'],
  ['nested inline', '<p><strong><em>a</em> b</strong> <span style="color: rgb(1, 2, 3)">c</span></p>'],
  ['text only', 'just text\nand a line'],
  ['newlines between blocks', '<p>a</p>\n<p>b</p>\n  <ul>\n  <li>x</li>\n</ul>'],
  ['a inside a', '<a href="1">one<a href="2">two</a></a>'],
]

describe('pure HTML parser against a browser', () => {
  it.each(CASES)('%s', (_name, html) => {
    expect(serializeChildren(parseHTMLFragment(html))).toBe(browser(html))
  })
})

describe('style', () => {
  it('reads properties like CSSStyleDeclaration', () => {
    const el = parseHTMLFragment('<p style="text-align: center; color: #f00; font-weight:700">x</p>').firstChild as never as {
      style: Record<string, unknown> & { getPropertyValue(n: string): string; length: number }
    }
    expect(el.style.textAlign).toBe('center')
    expect(el.style.color).toBe('rgb(255, 0, 0)')
    expect(el.style.getPropertyValue('font-weight')).toBe('700')
    expect(el.style.fontStyle).toBe('')
    expect(el.style.length).toBe(3)
  })

  it.each([['#f00', 'rgb(255, 0, 0)'], ['#F8E9E9', 'rgb(248, 233, 233)'], ['#ff000080', 'rgba(255, 0, 0, 0.5)'], ['#ff000081', 'rgba(255, 0, 0, 0.506)'], ['red', 'red'], ['rgb(1, 2, 3)', 'rgb(1, 2, 3)']])(
    'normalizes colour %s like a browser', (input, out) => {
      const el = document.createElement('span')
      el.style.color = input
      expect(normalizeColor(input)).toBe(out)
      expect(el.style.color).toBe(out)
    })
})
