# Demo script: before and after

Six short journeys. Each "before" was observed on the live catalog on 27 Sep 2026; each "after" is what the prototype should show. Use them to test the build and to take the before/after screenshots for the Q3 page of the write-up.

| # | Journey | Do this | Before (today's catalog) | After (prototype) | Enhancements |
|---|---|---|---|---|---|
| J1 | Search Microsoft docs | Search `microsoft docs` | Zero results; two listings for the same server | Microsoft Learn in the top 3; "Same server as Microsoft Learn MCP"; Up · No login · 3 tools · Free | E1, E9 |
| J2 | Choose an SEO tool | Search `seo audit`; compare Ahrefs, Abbyseo, MetricSpot | SEO category shows only Ahrefs; "seo" misses MetricSpot; prices scattered | All three in the top 10. Compare: Ahrefs OAuth + paid plan · Abbyseo no login + free tier, 1 tool can spend money · MetricSpot no login to list tools + free tier | E1, E8, E6, E3 |
| J3 | Assess a paid extractor | Search `extract structured data from web pages` | Labeled No Auth; price only inside a tool description | AgenticTotem row: No login · Cost "Per call" | E6 |
| J4 | Connect Exa | Search `web search` | Labeled No Auth; page says "Gateway rejected the request" | Red chip "Listed as No Auth · needs login"; status "Up · catalog can't connect" | E3, E2 |
| J5 | Check Confluence access | Open Confluence | Tools hidden until OAuth | "Same server as Atlassian"; write tools tagged; permissions include `write:jira-work` | E7, E9 |
| J6 | Who runs Google Workspace | Search `google workspace` | Provider shows "Google" | Owner "Hosted by TrueFoundry" | E5 |

## Screenshots for the write-up

Take each pair at the same window size, today's catalog on the left and the prototype on the right:

1. **Search `seo audit`:** today's results vs the prototype's table (E1, E2 to E6 visible as columns).
2. **Exa row:** today's "No Auth" vs the red chip (E3).
3. **Confluence page:** today's "Connect to view tools" vs the prototype's permissions list with `write:jira-work` (E7).
4. **Compare** of the three SEO servers (E8). No "before" exists; that absence is the point.

Annotate each with one line from `docs/04-rationale.md` (before → after → evidence).
