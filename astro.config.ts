import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import tailwindcss from "@tailwindcss/vite";
import preact from "@astrojs/preact";
import { remarkMermaid } from "./src/utils/remark-mermaid";

// https://astro.build/config
export default defineConfig({
  site: "https://phanthanhnam.com",
  integrations: [preact()],
  markdown: unified({
    remarkPlugins: [remarkMermaid],
    rehypePlugins: [],
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});
