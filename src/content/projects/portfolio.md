---
title: 'Portfolio Website'
description: 'This website — a static portfolio built with Astro, Tailwind CSS, and Preact. Features zoomable Mermaid diagrams and a floating table of contents, all deployed on Cloudflare Pages.'
techStack:
  - 'Astro'
  - 'Tailwind CSS v4'
  - 'TypeScript'
  - 'Preact'
  - 'Cloudflare Pages'
  - 'Mermaid'
githubUrl: 'https://github.com/phnthnhnm/portfolio'
featured: true
order: 2
---

You're looking at it. I built this site from scratch to pair with my resume. The goal was a fast, single-page portfolio that doesn't look like a template and has a few touches that make it feel alive.

I went with Astro because it ships zero JavaScript by default. Every component on this page is static HTML and CSS unless I explicitly mark it as an interactive island. The Mermaid diagram viewer inlines its SVG at build time and only pulls Mermaid from CDN when a diagram is actually on the page.

---

## How it's built

### Stack

The site is mostly static. Astro builds everything to flat HTML, CSS, and JS at deploy time. Two Cloudflare Pages Functions handle the contact form (sends email via Resend) and the visitor counter (increments a KV namespace). That's the only backend — no database, no framework server.

- **Astro 6** handles routing, content collections, and the build pipeline. Project detail pages use `getStaticPaths` so each project gets its own URL without client-side routing.
- **Tailwind CSS v4** with the Typography plugin handles all styling. The dark theme uses CSS custom properties in a `@theme` block — there's no `tailwind.config.js`.
- **TypeScript** for the Astro config, content schemas, and validation logic.
- **Cloudflare Pages** handles deployment, the contact API (`functions/api/contact.ts`), and the counter API (`functions/api/counter.ts`). I connected the GitHub repo and Cloudflare auto-detects Astro, runs `pnpm build`, and deploys the `dist/` folder.
- **Resend** sends contact form emails. The API key lives in a Cloudflare secret, not in the repo.
- **Turnstile** sits on the contact form to keep bots out. The siteverify runs on a separate Cloudflare Worker.

### Project structure

```
portfolio/
├── src/
│   ├── layouts/BaseLayout.astro      # HTML shell, header/footer, blob background
│   ├── pages/
│   │   ├── index.astro               # Single-page portfolio (all sections)
│   │   ├── status.astro              # Service status dashboard
│   │   └── projects/
│   │       ├── index.astro           # All projects listing
│   │       └── [slug].astro          # Dynamic project detail routes
│   ├── components/
│   │   ├── Hero.astro                # Full-viewport intro with CTAs
│   │   ├── About.astro               # Bio + quick facts card
│   │   ├── Projects.astro            # Featured project cards from content collection
│   │   ├── Experience.astro          # Vertical timeline
│   │   ├── Skills.astro              # Categorized tech tag grid
│   │   ├── Contact.astro             # Contact form (Turnstile + Resend API)
│   │   ├── BackgroundBlobs.astro     # Animated floating gradient orbs
│   │   ├── Header.astro              # Fixed nav bar with mobile menu
│   │   ├── Footer.astro              # Site footer
│   │   ├── SEO.astro                 # Meta tags, OG, JSON-LD
│   │   ├── VisitorCounter.astro      # KV-backed page view counter
│   │   ├── ServiceStatus.astro       # Individual service status indicator
│   │   ├── StatusLink.astro          # Link to /status dashboard
│   │   └── LastUpdated.astro         # Git-based last-modified date
│   ├── content/
│   │   ├── content.config.ts         # Zod schemas for project frontmatter
│   │   └── projects/                 # Markdown files (this page lives here)
│   ├── lib/
│   │   └── contact-validation.ts     # Zod schema for contact form input
│   ├── styles/global.css             # Tailwind directives + custom theme
│   └── utils/
│       ├── remark-mermaid.ts         # Custom remark plugin for Mermaid blocks
│       └── git.ts                    # Git last-modified helper
├── functions/api/
│   ├── contact.ts                    # Pages Function: validates + sends email via Resend
│   └── counter.ts                    # Pages Function: increments KV view counter
├── public/
│   ├── mermaid-viewer.js             # Standalone Mermaid renderer + zoom/pan
│   ├── logo.png
│   └── favicon.ico + variants
├── scripts/
│   └── lighthouse.mjs                # Lighthouse CI runner
├── astro.config.ts
├── wrangler.toml                     # Cloudflare Pages + KV bindings
└── package.json
```

---

## Features I'm happy with

### Content-driven projects

Each project on the homepage is a Markdown file in `src/content/projects/`. Astro's Content Collections API gives me a Zod-typed frontmatter schema, so if I mistype a field or forget a required value, the build fails immediately. Adding a new project is just dropping in a new `.md` file — the card grid and dynamic route pages pick it up automatically.

```typescript
// src/content.config.ts
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    techStack: z.array(z.string()),
    githubUrl: z.string().url().optional(),
    liveUrl: z.string().url().optional(),
    image: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});
```

Astro 6's content layer uses a `loader` pattern instead of the old `src/content/config.ts` approach — you point `glob()` at a directory and it pulls in every matching file. The detail pages still use `getStaticPaths` to generate one HTML file per project at build time.

### Contact form with Turnstile and Resend

The contact form does a Turnstile verification first (client-side widget → siteverify Worker → back token), then posts to `functions/api/contact.ts`. The function validates the payload with a Zod schema, builds a plain-text email, and sends it through Resend's API. Validation runs on both client and server so bad input never reaches the email provider.

The Resend API key is stored as a Cloudflare secret, not in version control. Local dev uses a `.dev.vars` file (gitignored) with a test key.

### Visitor counter

`functions/api/counter.ts` increments a counter in Cloudflare KV on each page load and returns the count. The `VisitorCounter` component fetches it at page load and displays it in the footer. If KV isn't configured (e.g. in local dev without Wrangler), it returns 0 gracefully.

### Mermaid diagrams with zoom and pan

I wrote a custom remark plugin that intercepts ` ```mermaid ` code blocks in Markdown and converts them to raw `<pre class="mermaid">` elements, bypassing Astro's built-in Shiki syntax highlighter.

On the client side, `mermaid-viewer.js` loads Mermaid 11 from CDN via dynamic import, initializes it with a dark theme matching the site's palette, and renders every `.mermaid` element as an SVG. After rendering, it wraps each diagram in a zoomable container with scroll-to-zoom, click-to-drag panning, and a double-click fullscreen overlay with independent zoom controls.

### Floating table of contents

Project detail pages have a sticky sidebar that lists every `h2` and `h3` heading from the Markdown content. An `IntersectionObserver` tracks which section is currently visible and highlights the corresponding TOC link. Hidden on mobile.

### Animated background blobs

Three large gradient orbs drift slowly behind all sections using CSS `@keyframes`. They're in a reusable `BackgroundBlobs.astro` component dropped into `BaseLayout`, so every page gets them for free. Pure CSS, no JS.

---

## Design decisions

| Decision                                                      | Reasoning                                                                                                                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Astro over Next.js or pure React**                          | This site has one interactive widget. Shipping a full SPA framework for 99% static content made no sense. Astro's island model means I only pay for the JS I actually need                                                                  |
| **Tailwind v4 over CSS modules**                              | v4's CSS-first config (`@theme` blocks, `@plugin` directives) eliminated `tailwind.config.js` entirely. Utility classes colocate styles with markup                                                                                         |
| **Content Collections over a CMS**                            | No database, no admin panel, no API. Markdown in the repo means version control, easy editing, and zero hosting cost                                                                                                                        |
| **Cloudflare Pages over Vercel/Netlify**                      | I was already using Cloudflare for DNS. Pages has the same free tier, auto-deploys from GitHub, and the Functions + KV combo handles the few dynamic bits (contact form, counter) without a separate backend                                |
| **Resend over SendGrid/Mailgun**                              | Cleaner API, simpler DX, and the free tier covers portfolio contact volume easily                                                                                                                                                           |
| **Custom remark plugin over an existing Mermaid integration** | Existing Astro Mermaid integrations either didn't support v11, required build-time rendering (heavy), or used outdated CDN URLs. A 20-line remark plugin and a separate client script gave me exact control over when and how Mermaid loads |
| **Cloudflare Functions over a separate backend**              | The contact form and counter are the only dynamic needs. Two 30-line Functions with KV is simpler than spinning up a separate service                                                                                                       |
| **Turnstile over reCAPTCHA**                                  | Less invasive UX (no image grid challenges), no Google dependency, and native Cloudflare integration                                                                                                                                        |

---

## Running locally

```bash
pnpm install
pnpm dev              # http://localhost:4321
pnpm dev:full         # Build + Wrangler (contact form, counter, etc. all work)
pnpm build            # Outputs to dist/
pnpm test             # Vitest
pnpm lighthouse       # Build + Lighthouse CI audit
```

For the contact form to work locally, create `.dev.vars` with `RESEND_API_KEY=re_xxx` and run `pnpm dev:full`.
