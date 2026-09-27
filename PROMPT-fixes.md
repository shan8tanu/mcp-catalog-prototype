# Cursor prompt: small fixes after review

Paste below the line into Cursor's Agent mode.

---

`docs/01-product-spec.md` and `data/synonyms.json` were updated. Re-read the spec sections mentioned and make these small changes. Don't change anything else.

1. **Login "Mixed":** if `login.claimed` is "API Key" or "OAuth2" but `login.observed` is "none", show "Mixed" in the Login cell (table, server page, compare) with tooltip "Tools are listed without login; the catalog says API key, so some tools may still need one". MetricSpot should show "Mixed".
2. **Consistent tool counts:** "can write" counts `write` + `destructive` everywhere. Abbyseo must read "8 · 1 can write · 1 can spend money" in the table, the server page and compare.
3. **Owner for vendor-documented servers:** show the vendor name from `operator.text` (e.g. "GitHub ✓"), not the host's domain. Tooltip: "Confirmed in the vendor's docs; server at <host>".
4. **Tool inputs:** on the server page, under each tool's description, a small grey line "inputs: a, b, c" from `tool-details.json` when available.
5. **Cost detail in compare:** under the Cost value, show `cost.evidence` in small grey text when present.
6. **No duplicate warnings:** on the server page, if `notes` exists, show it instead of the flag text (Exa currently shows the same warning twice).
7. **Search precision:** no fuzzy matching on tool names; tool names and synonyms match whole words only. Reload `synonyms.json` (two broad synonyms were removed). "microsoft docs" should no longer return WhenMeet or The Stall.
8. **Narrow widths:** at ~800 px the Actions column is cut off. Let the description wrap to two lines and keep "Try it" visible; below 640 px, stack rows as the spec says.

Then re-run the six journeys in `docs/03-demo-script.md`.
