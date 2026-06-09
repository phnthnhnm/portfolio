/**
 * Remark plugin that converts ```mermaid code blocks into
 * <pre class="mermaid"> HTML blocks, bypassing Shiki syntax highlighting
 * so Mermaid.js can render them client-side as SVG diagrams.
 */
import type { Root } from "mdast";
import { visit } from "unist-util-visit";

export function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, "code", (node: any, index, parent) => {
      if (node.lang !== "mermaid") return;

      // Replace the code node with a raw HTML node that Mermaid will render
      parent!.children.splice(index!, 1, {
        type: "html",
        value: `<pre class="mermaid">${node.value}</pre>`,
      });
    });
  };
}
