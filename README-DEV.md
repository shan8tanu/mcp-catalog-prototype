# MCP Catalog prototype: developer notes

A static Vite + React + TypeScript app that uses Tailwind CSS and MiniSearch. There is no backend. At runtime the app loads only `servers.json`, `tool-details.json` and `synonyms.json`.

## Run and build

You need Node 20.19 or newer, or Node 22.12 or newer.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-checks, then writes the static site to dist/
npm run preview   # serves dist/ at http://localhost:4173
```

`npm run dev` and `npm run build` first run `scripts/copy-data.mjs`. It copies those three files unchanged from `data/` to `public/data/`, so they end up in `dist/data/`. Don't edit `public/data/`; it is regenerated and gitignored.

To check search quality from the command line, run `npx -y tsx scripts/check-search.ts ["query" ...]`. It prints the top 10 results and where the journey servers rank.

## How it fits together

- **Routing:** hash-based, with three pages:
  - `#/` is the search page. The query is kept in `q`.
  - `#/server/:slug` is a server page.
  - `#/compare?s=a,b,c` is the compare view.
  - The compare selection `s` is carried across all pages. The router is in `src/lib/router.ts`.
- **Data loading:** handled in `src/state/data.tsx`.
  - `servers.json` and `synonyms.json` load first, and `tool-details.json` loads in parallel.
  - The search index is built once both have arrived.
  - Timings appear as `performance` marks: `data:core`, `data:details` and `data:index`.
- **Search:** `src/lib/search.ts`. Every query word, or one of its synonyms, must match. Ranking is name, then description, then tool names, then tool descriptions.
- **Filters:** `src/lib/filters.ts`.
- **Display values:** `src/lib/labels.ts` holds the status, login, tools, owner and cost values from spec section 4. `src/components/Values.tsx` renders them the same way in the table, on the server page and in compare.
- **Known issues:** data issues and judgement calls are listed in `NOTES.md`.

## Deploy `dist/`

The build uses a relative base (`./`) and hash routing. That means:

- `dist/` works from any path, including a GitHub Pages project subpath.
- No SPA rewrite rules are needed.

| Host | Build command | Output directory |
|---|---|---|
| Netlify | `npm run build` | `dist` |
| Vercel | `npm run build` (framework preset: Vite) | `dist` |
| Cloudflare Pages | `npm run build` | `dist` |

- **Netlify:** connect the repo with the settings above, or drag the `dist/` folder onto app.netlify.com/drop.
- **Vercel:** import the repo, or run `npx vercel deploy --prod` after building.
- **Cloudflare Pages:** connect the repo, or run `npx wrangler pages deploy dist` after building.
- **GitHub Pages:** there are two ways.
  - Run `npm run build`, then `npx gh-pages -d dist`, and set Pages to serve the `gh-pages` branch.
  - Or use a GitHub Actions workflow: run `npm ci && npm run build`, then `actions/upload-pages-artifact` with `path: dist`, then `actions/deploy-pages`.
