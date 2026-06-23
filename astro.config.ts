import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { satteriMermaid } from './src/utils/satteri-mermaid';

export default defineConfig({
  site: 'https://phanthanhnam.com',
  compressHTML: true,
  markdown: {
    processor: satteri({
      mdastPlugins: [satteriMermaid()],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
