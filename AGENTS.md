# AGENTS.md — Quartz 4 Digital Garden (vishal.wtf)

## Build & Dev Commands

- **Dev server:** `npx quartz build --serve` (hot-reload at localhost:8080)
- **Build:** `npx quartz build`
- **Type check:** `npm run check` (runs `tsc --noEmit && prettier --check`)
- **Format:** `npm run format` (prettier)
- **Test:** `npm run test` (tsx --test); single test: `npx tsx --test path/to/file.test.ts`

## Architecture

- **Framework:** Quartz 4 (static site generator for Obsidian-style markdown notes)
- **Content:** `content/` — Markdown files with YAML frontmatter (Blog/, Notes/, Projects/, Life/, Recommendations/)
  - `content/Recommendations/` taxonomy:
    - Category landing: `content/Recommendations/index.md`
    - Category folders: `Podcasts/`, `Talks/`, `Blogs/`, `Books/` (each with an `index.md`)
    - One note per recommendation inside category folders
    - Prefer slug-style filenames (e.g., `lenny-podcast.md`)
    - For podcasts, use `podcast` (show-level) and `podcast-episode` (episode-level) tags
    - Use `content/Recommendations/Podcasts/podcast-template.md` for show-level podcast notes
    - Use `content/Recommendations/Podcasts/podcast-episode-template.md` for episode-level notes
    - Episode notes should link to parent podcast notes for graph navigation
    - Keep authoring/contribution guidance in docs (`README.md`, `AGENTS.md`), not reader-facing index pages
- **Quartz core:** `quartz/` — TypeScript SSG engine (Preact components, unified/remark/rehype plugins)
  - `quartz/components/` — Preact page components (Head, Explorer, Graph, Search, etc.)
  - `quartz/plugins/` — Transformer, filter, and emitter plugins processing markdown→HTML
  - `quartz/util/`, `quartz/styles/` — Shared utilities and SCSS styles
- **Config:** `quartz.config.ts` (plugins, theme, site settings), `quartz.layout.ts` (page layout)

## Code Style

- TypeScript (ESM, `"type": "module"`), Preact for components (not React)
- Prettier for formatting; no semicolons or trailing commas enforced beyond prettier config
- Imports: use `./quartz/` relative paths; plugins via `import * as Plugin`, components via `import * as Component`
- Content files: Markdown with YAML frontmatter (`title`, `date`, `tags`, `draft`, `noindex`)
- Node >=22, npm >=10.9.2
