# Notes: data issues and build choices (spec v2)

Nothing in `data/` or `docs/` was changed. This file lists what I found while building, and the choices I made where the spec left room.

## Data issues

1. **Exa's flag text is not the chip text.** The `level: "blocker"` flag for `exa-mcp` reads "Labeled No Auth, but the configured URL returns 401…".
   - The red chip is built from the catalog label: "Listed as {`login.claimed`} · needs login". For all 18 blocker servers this gives "Listed as No Auth · needs login".
   - The server page shows the chip next to `notes` when the server has them (Exa does), otherwise next to the flag text, so the same warning never appears twice.

2. **`login.note` repeats `notes`.** This is true for both servers that have a `login.note` (Exa, MetricSpot), so the server page shows `notes` only.

3. **Self-contradicting operator text.** `calculator-mcp` and `slack-mcp` have `operator.text` = "Hosted by TrueFoundry, not by TrueFoundry".
   - The Owner column shows "Hosted by TrueFoundry" as the spec says.
   - The odd text appears only in the tooltip and in Details, verbatim.

4. **One server has no category.** It has `catalog.category: null`, so it appears only under Category "All".

## Choices where the spec left room

- **What gets a ✓.** Only checked values get one:
  - status (except "Not checked"),
  - the observed login (except unknown),
  - a tool list the server returned itself (`visibility = verified`),
  - cost with `basis = checked`.
  - Cost from vendor docs (`manual`) is shown without a ✓. Every check and listing timestamp falls on 27 Sep 2026 (IST), so the tooltip is always "Checked 27 Sep 2026".
- **Owner ✓.** It follows the Owner mapping and carries that mapping's tooltip. "Registrable domain" means the last two labels of `host`, except for common two-level suffixes such as `co.uk`.
  - For vendor-documented servers, the vendor name is the text between "Run by" and "(" in `operator.text` (e.g. "Run by GitHub (…)" gives "GitHub ✓"). The tooltip is "Confirmed in the vendor's docs; server at <host>".
- **Login "Mixed".** Shown when `login.observed` is "none" but `login.claimed` is "API Key" or "OAuth2". The tooltip names the claimed method, so OAuth2 claims read "…the catalog says OAuth, so some tools may still need one". "Mixed" has no ✓, because it combines a checked value with a catalog claim. It sorts between No login and OAuth.
- **Tools column.** The same text everywhere (table, server page, compare): the count, then "N can write" (`write` plus `destructive`), then "N can spend money", each only when non-zero. "After login" shows when the tool list is hidden.
- **Cost evidence in compare.** `cost.evidence` appears under the Cost value. For keyword guesses the value is "—" and the evidence is marked "(unverified)".
- **Cost.** Shown only when `cost.basis` is `manual` or `checked`. Keyword guesses (`free_claimed`, `mentions_pricing`) show "—" in the table. On the server page they appear under Details as "Pricing mention (unverified)".
- **Permissions in compare.** The row lists write/delete scopes. It says "No write or delete permissions" when scopes are listed but none match, and shows "—" when the server lists no scopes.
- **Informational login flags.** Flags such as "Labeled API key, but the server also supports OAuth sign-in" appear under Details → Catalog, to keep the header short.
- **Search.** Five behaviors go beyond the spec's wording:
  - **Compound names:** name endings are indexed, so "seo" finds Abbyseo and CalmSEO. Without this, Abbyseo ranks outside the top 10 for "seo audit".
  - **Where synonyms search:** synonyms match only names, providers, descriptions and tool names (whole words), not tool descriptions.
  - **Fuzziness:** words of 5 letters or more allow one typo in names, providers and descriptions ("microsft" works). Tool names never match fuzzily or by prefix. Swapped letters count as two edits, so "audti" doesn't match.
  - **Same tool:** when two or more query words match a server only through its tools, one tool must match all of them. Without this, The Stall matched "microsoft docs" through one tool mentioning Microsoft and another mentioning docs.
  - **Results:** "seo audit" gives 21 results, with Ahrefs 3rd, Abbyseo 6th and MetricSpot 9th. "microsoft docs" gives the two Microsoft Learn listings only. "google workspace" still includes Blackveil, because its `check_mx` tool description literally says "Google Workspace".
- **Sorting.** Clicking a header sorts ascending, a second click sorts descending, and a third returns to the default order. Unknown values stay last in both directions. Typing a new query returns to relevance order. On phones, a Sort dropdown replaces the hidden headers.
- **No "Working now" filter.** Removed on request, although spec E2 and section 5 list it. The list shows all servers; the Status column still shows failing ones, and the default order puts working servers first. Search results are in relevance order, so failing servers can rank high (EzBiz is 4th for "seo audit").
- **In memory, not in the URL:** filters and sort. In the URL: the query (`q`) and the compare selection (`s`).
