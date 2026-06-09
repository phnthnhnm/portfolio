import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import preact from "@astrojs/preact";
import { remarkMermaid } from "./src/utils/remark-mermaid";

// https://astro.build/config
export default defineConfig({
  site: "https://phanthanhnam.com",
  integrations: [preact()],
  markdown: {
    remarkPlugins: [remarkMermaid],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
