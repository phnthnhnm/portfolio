import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  site: "https://phanthanhnam.com",
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
  },
});
