# Cursor prompt: bring the app in line with spec v2

Paste everything below the line into Cursor's Agent mode, in this folder.

---

The spec has changed. Read `docs/01-product-spec.md` (v2) first; it replaces the earlier version. The app must now be **today's MCP catalog with a few enhancements**, not a new product. Keep it simple and understated. `docs/03-demo-script.md` has the journeys it must pass.

**Remove**
- The Why and About pages, the "Show the thinking" toggle, all D-markers and the decision side panel.
- The top banner (replace with one footer line: "Independent prototype · data snapshot 27 Sep 2026 · not affiliated with TrueFoundry").
- The "Try:" example chips and the helper text under the search box.
- The sidebar filters and their explanatory text, the source-badge legend, and all per-fact source badges.
- On the server page: the five numbered question sections and the Evidence section.
- Any code that loads `rationale.json`, `journeys.json` or `meta.json`. The app loads only `servers.json`, `tool-details.json` and `synonyms.json`.

**Build, per the spec**
- **Search page:** search box, then a horizontal filter row (Working now toggle, on by default, with "N hidden"; Login dropdown; Owner verified toggle; Read-only tools toggle; Category dropdown), then "N servers", then a **table** with sortable headers: MCP server (name, one-line description, and only when relevant a red wrong-label chip, "matches tool: x" or "Same server as X") · Status · Login · Tools · Owner · Cost · action ("Try it ↗" and a compare checkbox). Use the exact values and Owner mapping in section 4 of the spec. Checked values get a small ✓ with tooltip "Checked 27 Sep 2026"; unknown values show "—".
- **Search behavior:** all query words must match (AND) with light fuzziness; rank name > description > tool names > tool descriptions; synonyms from `synonyms.json`. With no query, list working servers with visible tools first and sort names ignoring leading symbols and emoji.
- **Server page:** header with the same values as the table row and three buttons (Try it in the playground ↗, Scan for security issues ↗, Add to compare); then Tools (one note line above the list, a tag only for write / destructive / spends money, 15 shown then "Show all"), Permissions (OAuth servers only; write/delete scopes highlighted, others behind "Show all"), Connect (Cursor config with Copy, plus the TrueFoundry Gateway URL option), and a collapsed Details section.
- **Compare:** up to 3 servers, six rows (Status, Login, Owner, Tools, Permissions, Cost); highlight only rows whose values differ; selection kept in the URL; a "Compare (n/3)" button in the header only when something is selected.
- **Style:** close to today's catalog: dark, neutral, compact table, one accent color; light mode follows the OS; works on a phone (rows stack).

**Rules:** don't modify `data/` or `docs/`. No network calls except the app's own JSON. Delete unused components and files.

**Done when** all nine acceptance items in section 9 of the spec pass. Walk through the six journeys in `docs/03-demo-script.md` yourself and fix anything that doesn't match. Update `README-DEV.md` if run or deploy steps changed.
