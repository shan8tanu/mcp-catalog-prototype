# MCP catalog: "help me choose" prototype (Q3)

A copy of today's TrueFoundry MCP catalog with a few enhancements that help a developer decide which server to adopt. It is scoped to assignment question 3 only: **same layout as today, better information**. The reasoning behind each enhancement lives in `docs/04-rationale.md` (for the write-up), not in the app.

## Start here
- **Updating the existing build:** paste `PROMPT.md` into Cursor's Agent mode.
- Then walk through `docs/03-demo-script.md` and take the before/after screenshots.

## Folder

| Path | What it is |
|---|---|
| `PROMPT.md` | Cursor prompt: bring the app in line with spec v2 |
| `docs/01-product-spec.md` | What to build: what stays, the nine enhancements (E1–E9), pages, acceptance |
| `docs/02-data-dictionary.md` | Every data field and where it came from |
| `docs/03-demo-script.md` | Six before/after journeys and the screenshots for the write-up |
| `docs/04-rationale.md` | Why each enhancement exists (before → after → evidence), for the write-up |
| `data/servers.json`, `data/tool-details.json`, `data/synonyms.json` | Loaded by the app |
| `data/rationale.json`, `data/journeys.json`, `data/meta.json` | Reference for the write-up; not loaded by the app |

## How the data was made (27 Sep 2026)
- Catalog snapshot of all 1,368 public records.
- The audit's gateway checks of the 680 No Auth entries.
- A direct MCP connection to every server without credentials: handshake, then the tool list or the published login metadata. No tool was ever run.
- A match against the full Official MCP Registry.
- Provider docs for the journey servers.

## Guardrails
- Independent prototype, clearly labeled; no TrueFoundry branding.
- Static: the app never calls MCP servers or TrueFoundry.
- The 4-page write-up stays code-free; the prototype is a linked supplement with screenshots.
