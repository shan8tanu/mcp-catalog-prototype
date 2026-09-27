// Dev check: prints the top results for the demo-journey queries.
// Run: npx -y tsx scripts/check-search.ts ["query" ...]
import { readFileSync } from 'node:fs';
import { buildIndex, search } from '../src/lib/search';
import type { Server, Synonyms, ToolDetails } from '../src/types';

const servers: Server[] = JSON.parse(readFileSync('data/servers.json', 'utf8'));
const details: ToolDetails = JSON.parse(readFileSync('data/tool-details.json', 'utf8'));
const synonyms: Synonyms = JSON.parse(readFileSync('data/synonyms.json', 'utf8'));

const t0 = performance.now();
const index = buildIndex(servers, details);
console.log(`index built in ${Math.round(performance.now() - t0)} ms`);

const targets: Record<string, string[]> = {
  'microsoft docs': ['microsoft-learn-mcp', 'microsoft-mcp'],
  'seo audit': ['ahrefs-mcp', 'abbyseo-mcp', 'metricspot-mcp'],
  'extract structured data from web pages': ['agentictotem-mcp'],
  'web search': ['exa-mcp'],
  'google workspace': ['google-workspace-mcp'],
  confluence: ['confluence-mcp'],
};
const queries = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(targets);

for (const q of queries) {
  const t = performance.now();
  const hits = search(index, q, synonyms);
  console.log(`\n"${q}" → ${hits.length} hits (${Math.round(performance.now() - t)} ms)`);
  hits.slice(0, 10).forEach((h, i) =>
    console.log(`${String(i + 1).padStart(2)}. ${h.slug.padEnd(34)} ${h.score.toFixed(1).padStart(7)}  ${h.tool ? `matches tool: ${h.tool}` : ''}`),
  );
  for (const slug of targets[q] ?? []) {
    const i = hits.findIndex((h) => h.slug === slug);
    console.log(`   target ${slug}: rank ${i + 1}`);
  }
}
