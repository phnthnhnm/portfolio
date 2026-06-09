import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import { remarkMermaid } from "./src/utils/remark-mermaid";

export default defineConfig({
  site: "https://phanthanhnam.com",
  integrations: [preact()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMermaid],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
