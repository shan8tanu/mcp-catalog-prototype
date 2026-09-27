# Data dictionary

All files are in `data/`. They are finished inputs: **the app reads them and never changes them.** The app loads only `servers.json`, `tool-details.json` and `synonyms.json`, and shows a small subset of the fields below (see the spec). In the app, checked values get a small ✓; everything else is shown plainly or as "—" when unknown. They were built on 27 Sep 2026 from five sources:

1. **Catalog snapshot:** the public list and all 1,368 detail records from `mcp-api.truefoundry.com/api/mcps`.
2. **Gateway check:** tool discovery through the catalog's own connection path for the 680 entries labeled No Auth, with a retry of the failures.
3. **Direct check:** a plain MCP connection to every server URL with no credentials (`initialize`; then `tools/list` if public, or the OAuth protected-resource metadata if a login is required), with one retry for failures. **No tool was ever called.**
4. **Official MCP Registry:** all 121,343 server versions, matched to catalog servers by remote URL.
5. **Manual review:** provider documentation for the servers in the demo journeys.

Timestamps for each source are in `meta.json → sources`.

## Files

| File | Size | Contents |
|---|---|---|
| `servers.json` | ~4.5 MB | One record per server (1,368), sorted by name. Everything except long tool text. |
| `tool-details.json` | ~4.1 MB | `{ slug: [ {name, title, description, inputs, required} ] }` for servers whose tool text we have. |
| `rationale.json` | small | The nine enhancements (E1–E9), what we kept and what we didn't add. **For the write-up; not loaded by the app.** |
| `journeys.json` | small | Six before/after journeys. **For testing and the write-up; not loaded by the app.** |
| `synonyms.json` | small | Query expansion for search. |
| `meta.json` | small | Sources and times, headline counts (incl. the login claimed-vs-observed matrix), caveats. **For the write-up; not loaded by the app.** |

## `servers.json` record

| Field | Type | Meaning | Checked or claimed |
|---|---|---|---|
| `slug` | string | Catalog id; used in URLs | — |
| `name`, `provider`, `description` | string | As published by the catalog | From catalog |
| `catalog.category` | string \| null | The catalog's category (secondary filter only) | From catalog |
| `catalog.auth_label` | `No Auth` \| `API Key` \| `OAuth2` | The catalog's auth label (a claim) | From catalog |
| `catalog.sample_prompts_generic` | bool | True if the catalog's sample prompts are the generic "What can X do?" template | — |
| `catalog.curated` | bool | One of ~65 hand-curated catalog entries (custom icon/color) | — |
| `server_url`, `host` | string | The endpoint the catalog uses | From catalog |
| `status.state` | enum (below) | Summary of all checks | Checked |
| `status.checks[]` | `{source, at, ok, detail}` | Every individual check, in order | Checked |
| `login.claimed` | string | = `catalog.auth_label` | From catalog |
| `login.observed` | `none` \| `oauth` \| `credentials` \| `unknown` | What the server did when connected without credentials | Checked |
| `login.observed_at` | ISO time | When | — |
| `login.flags[]` | `{level: blocker\|info, text}` | Mismatches between label and check. `blocker` = labeled No Auth but asks for login | Checked |
| `login.oauth` | object \| null | From OAuth protected-resource metadata: `authorization_servers` (hosts), `scopes` (permissions requested), `docs`, `policy`, `terms` | Declared by server |
| `login.note` | string \| null | Manual note (Exa, MetricSpot) | Vendor docs |
| `tools.visibility` | `verified` \| `catalog_only` \| `hidden` | verified = listed by the server itself in the direct check; catalog_only = names from the catalog record; hidden = no tool information before login | — |
| `tools.count` | int | Number of tools | — |
| `tools.listed_at` | ISO time \| null | When the verified list was taken | Checked |
| `tools.declared_share` | 0–1 \| null | Share of tools whose access label comes from the server's own annotations | — |
| `tools.access_counts` | `{read, write, destructive, spends_money, unknown}` | Counts per access type | — |
| `tools.est_definition_tokens` | int \| null | Rough tokens of the tool definitions (characters / 4). Only for verified lists | Checked (estimate) |
| `tools.items[]` | `{name, access, access_basis, sends_data_out, price_in_description}` | Per tool. `access`: `read` \| `write` \| `destructive` \| `spends_money` \| `unknown`. `access_basis`: `declared` (server annotations) \| `inferred` (from the tool name) | Declared by server / Inferred |
| `operator.label` | enum (below) | Who runs it | varies |
| `operator.text` | string | Human-readable one-liner, ready to display | — |
| `operator.basis` | `checked` \| `manual` \| `none` | How we know | — |
| `operator.evidence` | string | Evidence (a URL for vendor docs; otherwise a sentence) | — |
| `operator.registry` | object \| null | Official MCP Registry match: `name`, `method` (`domain`\|`github`), `owner`, `status`, `version`, `first_published`, `last_published`, `repository`, `versions_seen` | Checked |
| `cost.type` | enum (below) | Cost model | varies |
| `cost.basis` | `manual` \| `checked` \| `keyword` \| null | How we know | — |
| `cost.evidence` | string \| null | Quote or explanation (keyword snippets are surrounded by "…") | — |
| `cost.source` | URL \| null | Vendor pricing/docs page when manual | Vendor docs |
| `cost.keyword_hint` | string | For `mentions_pricing`: which pattern matched (`per_call`, `subscription`, `free_tier`) | Inferred |
| `cost.spend_tools[]` | string[] | Tools that can make a purchase (e.g. `purchase_report`, `create_checkout`) | Inferred |
| `cost.priced_tools[]` | string[] | Tools whose description states a price (e.g. "$0.01 USDC per URL") | Declared by server |
| `duplicates.same_endpoint_as[]` | slug[] | Other listings with the exact same server URL | Checked |
| `duplicates.possible_duplicates[]` | slug[] | Same description, not verified | — |
| `duplicates.note` | string \| null | e.g. Tandem: "same name, not a duplicate" | — |
| `connect.direct` | object | Ready-to-paste Cursor `mcp.json` content (`url`, and `headers` with `<YOUR_API_KEY>` for API-key servers) | — |
| `connect.via_gateway_url` | URL | The TrueFoundry Gateway URL for this server | From catalog |
| `connect.catalog_page` | URL | The existing catalog page with its playground | — |
| `notes` | string \| null | Manual note from the audit | Vendor docs |
| `server_info` | object \| null | `serverInfo` the server returned on connect (name, version) | Declared by server |

## Enums

**`status.state`**

| Value | Display | Count |
|---|---|---|
| `up` | Up | 1,217 |
| `up_direct_but_catalog_failed` | Reachable, but the catalog's connection fails | 23 |
| `failing` | Failing (failed twice, minutes apart) | 114 |
| `payment_or_quota` | Payment or quota error (HTTP 402) | 3 |
| `not_checked` | Not checked (our network couldn't reach it) | 11 |

**`operator.label`**

| Value | Display | Count |
|---|---|---|
| `vendor_documented` | Run by the vendor (documented) | 9 |
| `verified_domain` | Owner verified (domain) | 1,281 |
| `verified_github` | Owner verified (GitHub account) | 13 |
| `verified_domain_elsewhere` | Owner verified (domain); server runs elsewhere | 25 |
| `vendor_domain` | Runs on the vendor's domain (not formally verified) | 21 |
| `truefoundry_hosted` | Hosted by TrueFoundry | 13 |
| `truefoundry_demo` | TrueFoundry demo (sample data) | 4 |
| `unverified` | Not verified | 2 |

"Owner verified" means the publisher proved control of a domain or GitHub account to the Official MCP Registry. It does not by itself prove the publisher is the brand on the card.

**`cost.type`**

| Value | Display | Basis | Count |
|---|---|---|---|
| `free` | Free | manual | 2 |
| `free_tier` | Free tier | manual | 3 |
| `paid_plan` | Paid plan required | manual | 1 |
| `per_call` | Pay per call | manual or checked (HTTP 402) | 3 |
| `free_claimed` | Free (claimed in description) | keyword | 47 |
| `mentions_pricing` | Mentions pricing (unverified) | keyword | 122 |
| `unknown` | Unknown | — | 1,190 |

## Headline numbers (from `meta.json`)

- **Login label vs reality:** 18 servers labeled No Auth ask for a login; 57 labeled API key list their tools without one; 31 labeled API key support OAuth.
- **Tools:** verified lists for 655 servers (11,913 tools); 57% of those tools carry the server's own read-only/destructive hints; 305 servers have at least one tool that can change data.
- **Permissions:** 492 servers publish OAuth metadata; 346 list the permissions (scopes) they request.
- **Trust:** 1,327 servers match an Official MCP Registry entry with a verified namespace.
- **Money:** 64 servers have purchase tools; 27 state a price inside a tool description.
- **Context cost:** median ≈ 2,400 tokens of tool definitions; 1 in 10 servers above ≈ 17,000; largest ≈ 272,000.

## Caveats (for the write-up)

See `meta.json → caveats`. In short: checks are point-in-time; a readable tool list doesn't mean every tool works without login; declared annotations are untrusted hints; keyword-based cost is unverified; "owner verified" is about domain/account control; token counts are rough.
