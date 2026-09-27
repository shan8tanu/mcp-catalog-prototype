# Q3 rationale: what we added and why

*For the write-up (PDF). Not shown in the app. Generated from `data/rationale.json`.*

**Goal.** Make the registry the place a developer goes to decide which MCP server to adopt, not just browse a list.

**Approach.** Keep today's catalog as it is and add a small set of enhancements where the information is thin or wrong. Each enhancement answers one of the five questions from Q1 and fixes a problem found in Q2.

## Enhancements at a glance

| # | Enhancement | Answers | Fixes (Q2) | Journeys |
|---|---|---|---|---|
| E1 | Search finds servers by what they do | Does it do my job? | Q2 problem 6 (search and taxonomy) | J1, J2 |
| E2 | Status column and a 'Working now' filter | Does it work today? | Q2 problem 2: 93 of 680 No Auth servers failed twice minutes apart; 114 of 1,368 failed the direct check twice; 23 work directly but fail through the catalog's own connection | J4 |
| E3 | Login shows what the server actually did | Can I connect it safely? | Q2 problem 1 (wrong authentication or connection configuration); Exa journey | J2, J4 |
| E4 | Tools column with risk flags | Does it do my job? / Can I connect it safely? | Q2 problem 3 | — |
| E5 | Owner instead of Provider | Do I trust who runs it? | Q2 problem 4 | J6 |
| E6 | Cost, only when known | What will it cost me? | Q2 problem 5 (price and payment semantics) | J2, J3 |
| E7 | More useful server page | Can I connect it safely? | Confluence publishes its OAuth scopes before login, including write:jira-work | J5 |
| E8 | Compare up to three servers | All five | SEO journey: Ahrefs, Abbyseo and MetricSpot differ on login, cost and free path, which today can't be seen side by side | J2 |
| E9 | 'Same server as' note | Does it do my job? | Q2 problem 7 and its 'ignore' rule (the two Tandems are different servers) | J1, J5 |

## Each enhancement

### E1 · Search finds servers by what they do

- **Before:** Search matches names and providers only. 'seo' misses MetricSpot even though its description says SEO; 'microsoft docs' and 'figma' return nothing although matching servers exist.
- **After:** Search also covers descriptions, tool names and tool descriptions, with a small synonym list. All words must match. A row matched through a tool says which tool.
- **Evidence:** Q2 problem 6 (search and taxonomy). Tool descriptions are available for 655 servers from the direct check.

### E2 · Status column and a 'Working now' filter

- **Before:** No status anywhere. A developer finds out a server is down only after trying to connect.
- **After:** Each row shows Up, Failing, 'Up · catalog can't connect', or Not checked. Failing servers are hidden by default, not deleted, with a visible 'N hidden' count.
- **Evidence:** Q2 problem 2: 93 of 680 No Auth servers failed twice minutes apart; 114 of 1,368 failed the direct check twice; 23 work directly but fail through the catalog's own connection.

### E3 · Login shows what the server actually did

- **Before:** The auth badge is a hand-entered label. 18 servers labeled No Auth ask for a login when connected; 31 labeled API key actually use OAuth.
- **After:** The Login column shows what happened when we connected, with a small checkmark. When the catalog label is wrong, the row shows one red chip: 'Listed as No Auth · needs login'.
- **Evidence:** Q2 problem 1 (wrong authentication or connection configuration); Exa journey.

### E4 · Tools column with risk flags

- **Before:** 617 entries show no tools before connecting; nothing says whether a tool can change data or spend money.
- **After:** Tool count per row, plus 'can write' or 'can spend money' when relevant. 'After login' when the list is hidden.
- **Evidence:** Q2 problem 3. 655 servers list tools openly; 305 have tools that can change data; 64 have purchase tools.

### E5 · Owner instead of Provider

- **Before:** 'Provider' is usually just the domain name. 'Google Workspace' (provider: Google) and 'Playwright' (provider: Microsoft) run on TrueFoundry's servers; Postgres and Filesystem are demos.
- **After:** Owner column: the verified domain with a checkmark, 'Hosted by TrueFoundry', 'Demo', or 'Unverified'.
- **Evidence:** Q2 problem 4. 1,327 servers match an Official MCP Registry entry with proven domain or GitHub ownership.

### E6 · Cost, only when known

- **Before:** Cost is invisible or buried in tool descriptions. AgenticTotem is labeled No Auth but charges $0.01 USDC per URL.
- **After:** A Cost column shows Free, Free tier, Paid plan or Per call where verified; otherwise a dash.
- **Evidence:** Q2 problem 5 (price and payment semantics).

### E7 · More useful server page

- **Before:** Tools are hidden behind 'Connect to view tools' for login servers; no permissions; no config for a client like Cursor.
- **After:** Tool descriptions with a tag only for write, destructive or spends-money tools; permissions requested before login (write scopes highlighted); a copy-ready Cursor config and the TrueFoundry Gateway option.
- **Evidence:** Confluence publishes its OAuth scopes before login, including write:jira-work. 346 servers publish their scopes.

### E8 · Compare up to three servers

- **Before:** No way to compare; developers open tabs.
- **After:** Six rows: status, login, owner, tools, permissions, cost. Only rows that differ are highlighted.
- **Evidence:** SEO journey: Ahrefs, Abbyseo and MetricSpot differ on login, cost and free path, which today can't be seen side by side.

### E9 · 'Same server as' note

- **Before:** Microsoft Learn appears twice; Confluence and Atlassian share one endpoint.
- **After:** A quiet 'Same server as X' line under the name. Nothing is merged or deleted.
- **Evidence:** Q2 problem 7 and its 'ignore' rule (the two Tandems are different servers).

## What we kept from today's catalog

- **Search box, filter dropdowns, table, sortable headers.** Familiar and fast; we improve what they contain.
- **Category and auth filters.** Kept; auth now reflects the check.
- **'Try it' and the playground.** The catalog's best feature; every row still links to it.
- **Scan for security issues.** Linked from each server page.
- **One page per server.** Same structure, with more decision-relevant detail.

## What we deliberately did not add

- No overall score or grade: it hides the reason and mixes fresh and stale data.
- No GitHub stars or popularity sort: most servers are hosted with no public code, and we have no usage data.
- No explanation inside the app: the reasoning lives in the write-up.
