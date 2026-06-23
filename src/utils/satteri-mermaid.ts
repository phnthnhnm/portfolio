export function satteriMermaid() {
  return {
    name: 'mermaid',
    code(node: { lang?: string | null; value: string }): { rawHtml: string } | void {
      if (node.lang !== 'mermaid') return;
      return { rawHtml: `<pre class="mermaid">${node.value}</pre>` };
    },
  };
}
