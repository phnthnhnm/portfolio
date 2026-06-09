---
title: "Portfolio Website"
description: "This website — a static portfolio built with Astro, Tailwind CSS, and Preact. Features an interactive terminal emulator, zoomable Mermaid diagrams, and a floating table of contents, all deployed on Cloudflare Pages."
techStack:
  - "Astro"
  - "Tailwind CSS v4"
  - "TypeScript"
  - "Preact"
  - "Cloudflare Pages"
  - "Mermaid"
githubUrl: "https://github.com/phnthnhnm/portfolio"
featured: true
order: 2
---

You're looking at it. I built this site from scratch to pair with my resume. The goal was a fast, single-page portfolio that doesn't look like a template and has a few touches that make it feel alive.

I went with Astro because it ships zero JavaScript by default. Every component on this page is static HTML and CSS unless I explicitly mark it as an interactive island. The terminal widget and the Mermaid diagram viewer are the only things that load client-side JS, and even those are tree-shaken Preact components and a single dynamic import from CDN.

---

## How it's built

### Stack

The site is pure static output. Astro builds everything to flat HTML, CSS, and JS files at deploy time. There's no server, no database, no API calls at runtime.

- **Astro 5** handles routing, content collections, and the build pipeline. I used its `getStaticPaths` API for the project detail pages so each project gets its own URL without any client-side routing.
- **Tailwind CSS v4** with the Typography plugin handles all styling. The dark theme uses CSS custom properties defined in a `@theme` block.
- **Preact** powers the two interactive islands: the floating terminal emulator and the Mermaid diagram viewer. Preact is about 3KB instead of React's 40KB.
- **TypeScript** for the Astro config, content collection schemas, and the Preact terminal component.
- **Cloudflare Pages** handles deployment. I connected the GitHub repo and Cloudflare auto-detects Astro, runs `pnpm build`, and deploys the `dist/` folder to my custom domain.

### Project structure

```
portfolio/
├── src/
│   ├── layouts/BaseLayout.astro    # HTML shell, CSS import, header/footer
│   ├── pages/
│   │   ├── index.astro             # Single-page portfolio (all sections)
│   │   └── projects/[slug].astro   # Dynamic project detail routes
│   ├── components/
│   │   ├── Hero.astro              # Full-viewport intro with CTAs
│   │   ├── Projects.astro          # Card grid from Content Collection
│   │   ├── Experience.astro        # Vertical timeline
│   │   ├── Skills.astro            # Categorized tech tags
│   │   ├── Contact.astro           # Formspree form + social links
│   │   ├── Terminal.island.tsx     # Preact island: interactive terminal
│   │   └── SEO.astro               # Meta tags, OG, JSON-LD
│   ├── content/
│   │   ├── config.ts               # Zod schemas for project frontmatter
│   │   └── projects/               # Markdown files (this page lives here)
│   ├── styles/global.css           # Tailwind directives + custom theme
│   └── utils/remark-mermaid.ts     # Custom remark plugin for Mermaid blocks
├── public/
│   ├── mermaid-viewer.js           # Standalone Mermaid renderer + zoom/pan
│   ├── favicon.ico
│   └── logo.png
├── astro.config.ts
└── package.json
```

---

## Features I'm happy with

### Content-driven projects

Each project on the homepage is a Markdown file in `src/content/projects/`. Astro's Content Collections API gives me a Zod-typed frontmatter schema, so if I mistype a field or forget a required value, the build fails immediately. Adding a new project is just dropping in a new `.md` file with frontmatter — the card grid and dynamic route pages pick it up automatically.

```typescript
// src/content/config.ts
const projects = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    techStack: z.array(z.string()),
    githubUrl: z.string().url().optional(),
    liveUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});
```

The detail pages use Astro's `getStaticPaths` to generate one HTML file per project at build time. No client-side router, no loading spinners. Each page gets its own `<title>`, meta description, and structured data for SEO.

### Interactive terminal

The floating terminal in the bottom-right corner is a Preact island. It loads about 6KB of JS (gzipped to 2.5KB) and only when the page finishes rendering.

I built a little command registry that maps user input to output strings. It supports tab completion (pressing Tab with a partial command fills in the rest), command history (up/down arrows cycle through previous commands), and a few predefined commands: `whoami`, `ls projects/`, `cat skills.json`, `contact`, and `help`. Unknown commands get a `bash: command not found` response.

The terminal state (open/closed, input, output history) is managed with Preact hooks. The blinking cursor is a CSS animation on a span. The whole thing is under 200 lines of TSX.

### Mermaid diagrams with zoom and pan

I wanted the project detail pages to have proper architecture diagrams, not ASCII boxes. I wrote a custom remark plugin that intercepts `mermaid`-language code blocks in Markdown and converts them to raw `<pre class="mermaid">` elements, bypassing Astro's built-in Shiki syntax highlighter.

On the client side, a standalone script (`mermaid-viewer.js`) loads Mermaid 11 from CDN via dynamic import, initializes it with a dark theme matching the site's palette, and renders every `.mermaid` element as an SVG. After rendering, it wraps each diagram in a zoomable container with scroll-to-zoom, click-to-drag panning, and a double-click fullscreen overlay with independent zoom controls.

The overlay uses `onwheel` and `onmousedown` properties (not `addEventListener`) so handlers replace rather than stack when the overlay reopens. The zoom function keeps the point under the cursor stationary during scaling, like a map viewer.

### Floating table of contents

Project detail pages have a sticky sidebar that lists every `h2` and `h3` heading from the Markdown content. An `IntersectionObserver` with a root margin of `-80px 0px -70% 0px` tracks which section is currently visible and highlights the corresponding TOC link. The TOC is hidden on mobile and only appears on desktop where there's room.

---

## Design decisions

| Decision                                                      | Reasoning                                                                                                                                                                                                                                       |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Astro over Next.js or pure React**                          | This site has one interactive widget and a diagram viewer. Shipping a full SPA framework for 99% static content made no sense. Astro's island model means I only pay for the JS I actually need                                                 |
| **Preact over React**                                         | The terminal is simple enough that I don't need React's ecosystem. Preact's `preact/compat` alias means I can still use any React library if I ever need to                                                                                     |
| **Tailwind v4 over CSS modules**                              | v4's CSS-first config (`@theme` blocks, `@plugin` directives) eliminated the `tailwind.config.js` file entirely. Utility classes colocate styles with markup, which is ergonomic for a solo project                                             |
| **Content Collections over a CMS**                            | No database, no admin panel, no API. Markdown in the repo means version control, easy editing, and zero hosting cost                                                                                                                            |
| **Cloudflare Pages over Vercel/Netlify**                      | I was already using Cloudflare for DNS. Pages has the same free tier, auto-deploys from GitHub, and doesn't require a config file for Astro                                                                                                     |
| **Custom remark plugin over an existing Mermaid integration** | The existing Astro Mermaid integrations either didn't support v11, required build-time rendering (heavy), or used outdated CDN URLs. A 20-line remark plugin and a separate client script gave me exact control over when and how Mermaid loads |

---

## Running locally

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # Outputs to dist/
```
