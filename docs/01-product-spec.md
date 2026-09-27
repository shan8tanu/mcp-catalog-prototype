# Product spec (v2): "Help me choose" enhancements to the MCP catalog

**Scope:** assignment question 3 only. **Data snapshot:** 27 Sep 2026. **Type:** independent prototype, not affiliated with TrueFoundry.

## 1. What this is

A copy of today's catalog (mcps.truefoundry.com) with a small set of enhancements that help a developer **decide** which MCP server to adopt. It is not a redesign. Everything that works today stays; we add checked information where the catalog is thin or wrong.

Keep it simple and understated. The explanation of *why* each change was made lives in the write-up (PDF) and in `docs/04-rationale.md`, not in the app.

## 2. What stays the same as today

| Today's catalog | Kept as is |
|---|---|
| One page: search box, filter dropdowns, a table of servers, "N servers" count | Same layout and tone |
| Column-header sorting | Kept |
| Category filter and auth filter | Kept (auth now shows what we checked, see E3) |
| "Try it" per row | Kept, links to the catalog's own playground page |
| Server page with description and tools | Kept, with more detail (see E7) |
| "Scan for security issues" | Kept, links to the catalog page |

## 3. What we add

| # | Enhancement | Why (from Q1/Q2) |
|---|---|---|
| E1 | **Search finds servers by what they do**: names, descriptions, tool names and tool descriptions | "seo" misses MetricSpot; "microsoft docs" and "figma" return nothing today |
| E2 | **Status column** and a **"Working now" filter**, on by default | 93 of 680 No Auth servers failed twice; nothing shows it today |
| E3 | **Login shows what the server actually did**, with a warning when the catalog label is wrong | 18 servers labeled No Auth ask for a login (Exa) |
| E4 | **Tools column**: count, plus "can write" / "can spend money" when relevant | 617 entries show no tools; 64 servers have purchase tools |
| E5 | **Owner column** instead of Provider: verified domain, hosted by TrueFoundry, demo, or unverified | "Google Workspace" runs on TrueFoundry; "provider" is usually just the domain |
| E6 | **Cost**, shown only when known | No Auth is not free (AgenticTotem charges per call) |
| E7 | **Server page additions**: tool descriptions with risk tags, permissions requested before login, a copy-ready Cursor config and the TrueFoundry Gateway option | Confluence asks for `write:jira-work` before you see any tools |
| E8 | **Compare up to 3 servers** | The brief asks what a user compares |
| E9 | **"Same server as …" note** on duplicate listings | Microsoft Learn ×2; Atlassian/Confluence |

## 4. Page: search and table (`#/`)

**Top:** product name (e.g. "MCP Catalog, prototype"), and a "Compare (n/3)" button that appears only when something is selected. No other navigation.

**Search box:** placeholder "Search by name or by what you need, e.g. seo audit". No example chips, no helper text.

- Matches name, provider, description, tool names and tool descriptions (`tool-details.json`), with `synonyms.json` expansion.
- **Every query word, or one of its synonyms, must match** (AND), with light fuzziness for typos. If the whole query is a synonym key (e.g. "microsoft docs"), its values count too. In our test of this rule, "seo audit" returns about 60 servers (not 431) with Abbyseo, Ahrefs and MetricSpot in the top 10.
- Ranking: name > description > tool names > tool descriptions.
- No fuzzy matching on tool names; tool names match whole words only (`check_mx` must not match "workspace"). Synonyms match whole words only.
- If a row matched only through a tool, show a small grey line under the description: "matches tool: `run_audit`".
- "seo audit" should return a short list with Abbyseo, MetricSpot and Ahrefs near the top.

**Filter row** (horizontal, like today's dropdowns, no explanatory text):

| Control | Options | Data |
|---|---|---|
| Working now (toggle, **on** by default) | On hides failing, payment/quota errors. Shows "N hidden" next to the count | `status.state` in `up`, `up_direct_but_catalog_failed`, `not_checked` |
| Login (dropdown) | All · No login · OAuth · API key | `login.observed` = `none` / `oauth` / `credentials` (unknown shows under All only) |
| Owner verified (toggle) | Only verified or vendor-run | `operator.label` in `verified_domain`, `verified_github`, `vendor_documented` |
| Read-only tools (toggle) | Only servers whose visible tools all read | every `tools.items[].access = read` and `tools.visibility != hidden` |
| Category (dropdown) | Today's categories | `catalog.category` |

**Table columns** (sortable headers):

| Column | Content | Data |
|---|---|---|
| MCP server | Name (bold) and one-line description. Under it, only when relevant: a red chip if the catalog label is wrong ("Listed as No Auth · needs login"), "matches tool: x", or "Same server as X" | `name`, `description`, `login.flags` (level `blocker`), `duplicates.same_endpoint_as` |
| Status | "Up" (green), "Failing" (red), "Up · catalog can't connect" (amber), "Not checked" (grey) | `status.state` |
| Login | "No login" / "OAuth" / "API key" / "—". **Exception:** if the catalog label is API Key or OAuth2 but the server listed its tools without login, show "Mixed" (tooltip: "Tools are listed without login; the catalog says API key, so some tools may still need one") | `login.observed`, `login.claimed` |
| Tools | "8" or "8 · 1 can spend money" or "12 · 3 can write"; "After login" if hidden. "Can write" counts `write` **and** `destructive`; the table, server page and compare must use the same counts | `tools.count`, `tools.access_counts`, `tools.visibility` |
| Owner | "abbyseo.com ✓", "Hosted by TrueFoundry", "Demo", "Unverified" | `operator.label`, `operator.registry.owner`, `host` |
| Cost | Only when known: "Free", "Free tier", "Paid plan", "Per call"; otherwise "—" | `cost.type` where `cost.basis` is `manual` or `checked` |
| (action) | "Try it ↗" and a compare checkbox | `connect.catalog_page` |

**Owner column values** (from `operator.label`):

| Label | Show | Tooltip |
|---|---|---|
| `verified_domain` | `<operator.registry.owner>` ✓ | "Ownership proven in the Official MCP Registry" |
| `verified_domain_elsewhere` | `<operator.registry.owner>` ✓ | "Ownership proven; server runs on `<host>`" |
| `verified_github` | `@<operator.registry.owner>` ✓ | "GitHub account proven in the Official MCP Registry" |
| `vendor_documented` | the vendor's name from `operator.text` (e.g. "GitHub") ✓ | "Confirmed in the vendor's docs; server at `<host>`" |
| `vendor_domain` | registrable domain of `host` (no ✓) | "Runs on the vendor's domain; not formally verified" |
| `truefoundry_hosted` | Hosted by TrueFoundry | `operator.text` |
| `truefoundry_demo` | Demo | "Sample data, for trying only" |
| `unverified` | Unverified | — |

**Checked vs claimed, in two states only:** a small ✓ after values we checked (tooltip: "Checked 27 Sep 2026"); no mark otherwise. Unknown values show "—" (tooltip "Unknown"). No legend, no other badges.

**Default order (no query):** working servers with a visible tool list first, then the rest; names sorted ignoring leading symbols and emoji. With a query: relevance.

**Mobile (≤ 640 px):** each row becomes a stacked block: name + description, then the column values on one wrapped line.

## 5. Page: server (`#/server/:slug`)

**Header:** name, description, then one line of the same values as the table (status, login, tools, owner, cost). Buttons: **Try it in the playground ↗**, **Scan for security issues ↗** (both open `connect.catalog_page`), **Add to compare**. Under the header, only if present: the wrong-label warning, "Same server as X", and `notes`. If `notes` exists, show it instead of the flag's own text, so the same warning never appears twice (e.g. Exa).

**Tools** (heading "Tools · 8"):
- One small line above the list: "Listed by the server on 27 Sep" or "Names from the catalog; not verified" or "Visible only after login". If `est_definition_tokens` exists, add "· about 2,100 tokens of context".
- Each tool: name, its one-line description (from `tool-details.json`, if any), and a small grey line with its input names (e.g. "inputs: url, email"), so a developer can see whether a tool can do exactly what they need. A tag only when access is write, destructive or spends money. Read is the default and gets no tag. If access labels are guessed from names (`access_basis = inferred`), say so once in the note above the list, not per tool.
- Show 15, then "Show all".

**Permissions** (only for OAuth servers with `login.oauth`): "Signs in with auth.atlassian.com". List scopes containing `write` or `delete` (highlighted), others behind "Show all N".

**Connect:**
- Cursor config (`connect.direct`) in a code block with a Copy button, and one line: "Paste into .cursor/mcp.json".
- One line and a copyable URL: "Or connect through TrueFoundry MCP Gateway (central login, access control, logs)" (`connect.via_gateway_url`).

**Details** (collapsed by default): checks with times (`status.checks`), Official MCP Registry entry (`operator.registry`), catalog auth label and category, endpoint, cost evidence (`cost.evidence`, `cost.source`).

No numbered question sections, no Evidence section, no badges per fact.

## 6. Page: compare (`#/compare?s=a,b,c`)

Up to 3 servers, six rows: Status, Login, Owner, Tools (count + can write / can spend money), Permissions (write scopes, if any), Cost. Under the Cost value, show `cost.evidence` in small grey text when it exists (e.g. "One free audit per IP per day"), since "Free tier" alone doesn't say what's free. Highlight a row only when the values actually differ. A "Remove" link per column. The selection lives in the URL.

## 7. Style

- Match today's catalog: dark, neutral, compact table, one accent color. Light mode follows the OS.
- No TrueFoundry logo or brand name in the header.
- One footer line: "Independent prototype · data snapshot 27 Sep 2026 · not affiliated with TrueFoundry".
- Accessible: keyboard navigation, visible focus, labels on controls, sufficient contrast.

## 8. Technical

- Vite + React + TypeScript, Tailwind, MiniSearch, hash routing. No backend.
- Load `servers.json`, `synonyms.json` at startup and `tool-details.json` in parallel (search index built when it arrives).
- `rationale.json`, `journeys.json` and `meta.json` are **not used by the app**; they support the write-up.
- Never modify `data/`. No network calls except loading the app's own JSON.

## 9. Acceptance

1. The page looks like today's catalog: search, filter row, table, "N servers", sortable headers, "Try it".
2. "seo audit" returns a short list; Abbyseo, MetricSpot and Ahrefs are in the top 10.
3. "microsoft docs" returns Microsoft Learn in the top 3, with "Same server as Microsoft Learn MCP".
4. Exa's row shows the red chip "Listed as No Auth · needs login".
5. AgenticTotem shows Cost "Per call" and Login "No login".
6. Confluence's page lists `write:jira-work` under Permissions and says "Same server as Atlassian".
7. Google Workspace shows Owner "Hosted by TrueFoundry".
8. Compare of Ahrefs, Abbyseo and MetricSpot shows six rows, with only differing rows highlighted.
9. No Why page, About page, thinking toggle, markers, legends, or per-fact badges.

## 10. Out of scope

Explaining the design inside the app, reviews or ratings, popularity sorting, accounts, live checks, calling any MCP server.
