import MiniSearch, { type SearchOptions, type SearchResult } from 'minisearch';
import type { Server, Synonyms, ToolDetails } from '../types';

const STOP_WORDS = new Set(
  'a an and are as at be by can do for from get i in is it its me my of on or our should that the this to use using what with your you'.split(' '),
);

/** Splits on whitespace and punctuation (incl. `_` and `-`), and also splits camelCase while keeping the joined word. */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[\s\p{P}\p{S}]+/u)) {
    if (!raw) continue;
    out.push(raw);
    const parts = raw.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' ');
    if (parts.length > 1) out.push(...parts);
  }
  return out;
}

export function processTerm(term: string): string | null {
  let t = term.toLowerCase();
  if (t.length < 2 || STOP_WORDS.has(t)) return null;
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) t = t.slice(0, -1);
  return t;
}

type Field = 'name' | 'nameParts' | 'provider' | 'description' | 'toolNames' | 'toolText';
const FIELDS: Field[] = ['name', 'nameParts', 'provider', 'description', 'toolNames', 'toolText'];
const TOOL_FIELDS: Field[] = ['toolNames', 'toolText'];

const BOOST: Record<Field, number> = { name: 8, nameParts: 6, provider: 4, description: 4, toolNames: 2, toolText: 1 };

/** Word endings of compound names, so "seo" finds "Abbyseo" and "SEOcrawl" alike. */
function nameParts(name: string): string {
  const out: string[] = [];
  for (const w of name.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    for (let i = 1; w.length - i >= 3; i++) out.push(w.slice(i));
  }
  return out.join(' ');
}

const WORD_OPTIONS: SearchOptions = {
  boost: BOOST,
  fields: ['name', 'nameParts', 'provider', 'description', 'toolText'],
  prefix: (term) => term.length >= 4,
  fuzzy: (term) => (term.length >= 5 ? 1 : false),
};

// Tool names are identifiers: whole words only.
const TOOL_NAME_OPTIONS: SearchOptions = { boost: BOOST, fields: ['toolNames'], prefix: false, fuzzy: false };

// Synonyms are curated phrases: exact words, all of them. Common ones ("check", "keywords") appear in
// most long tool descriptions, so synonyms don't search those.
const SYNONYM_OPTIONS: SearchOptions = {
  boost: BOOST,
  fields: ['name', 'nameParts', 'provider', 'description', 'toolNames'],
  prefix: false,
  fuzzy: false,
  combineWith: 'AND',
};
const SYNONYM_WEIGHT = 0.5;

export interface SearchIndex {
  ms: MiniSearch;
  details: ToolDetails;
  bySlug: Map<string, Server>;
}

export function buildIndex(servers: Server[], details: ToolDetails): SearchIndex {
  const ms = new MiniSearch({ idField: 'id', fields: FIELDS, tokenize, processTerm, searchOptions: WORD_OPTIONS });
  ms.addAll(
    servers.map((s) => ({
      id: s.slug,
      name: s.name,
      nameParts: nameParts(s.name),
      provider: s.provider,
      description: s.description,
      toolNames: s.tools.items.map((t) => t.name).join(' '),
      toolText: (details[s.slug] ?? []).map((t) => `${t.title ?? ''} ${t.description ?? ''}`).join('\n'),
    })),
  );
  return { ms, details, bySlug: new Map(servers.map((s) => [s.slug, s])) };
}

export interface Hit {
  slug: string;
  score: number;
  /** Set when the server matched only through its tools. */
  tool: string | null;
}

interface Word {
  raw: string;
  term: string;
}

function words(text: string): Word[] {
  const out: Word[] = [];
  for (const raw of text.split(/[\s\p{P}\p{S}]+/u)) {
    const term = raw ? processTerm(raw) : null;
    if (term && !out.some((w) => w.term === term)) out.push({ raw, term });
  }
  return out;
}

/** For each query word, the synonym phrases that can stand in for it. Multi-word keys cover all their words. */
function alternatives(query: string, qwords: Word[], synonyms: Synonyms): Map<string, string[]>[] {
  const q = ` ${query.toLowerCase().replace(/\s+/g, ' ').trim()} `;
  const perWord = qwords.map(() => new Map<string, string[]>());
  for (const [key, values] of Object.entries(synonyms)) {
    if (key.startsWith('_') || !Array.isArray(values)) continue;
    if (!q.includes(` ${key.toLowerCase()} `)) continue;
    const keyTerms = new Set(words(key).map((w) => w.term));
    qwords.forEach((w, i) => {
      if (keyTerms.has(w.term)) perWord[i].set(key, values);
    });
  }
  return perWord;
}

interface WordMatch {
  fields: Set<Field>;
  terms: Set<string>;
}

interface Acc {
  score: number;
  /** Per query word: the fields and index terms it matched. */
  words: Map<number, WordMatch>;
}

export function search(index: SearchIndex, query: string, synonyms: Synonyms): Hit[] {
  const qwords = words(query);
  if (!qwords.length) return [];
  const acc = new Map<string, Acc>();
  const add = (r: SearchResult, i: number, weight: number) => {
    const id = String(r.id);
    let a = acc.get(id);
    if (!a) acc.set(id, (a = { score: 0, words: new Map() }));
    a.score += r.score * weight;
    let w = a.words.get(i);
    if (!w) a.words.set(i, (w = { fields: new Set(), terms: new Set() }));
    for (const [term, fields] of Object.entries(r.match)) {
      w.terms.add(term);
      for (const f of fields) w.fields.add(f as Field);
    }
  };

  const alts = alternatives(query, qwords, synonyms);
  const phraseCache = new Map<string, SearchResult[]>();
  qwords.forEach((w, i) => {
    for (const r of index.ms.search(w.raw, WORD_OPTIONS)) add(r, i, 1);
    for (const r of index.ms.search(w.raw, TOOL_NAME_OPTIONS)) add(r, i, 1);
    for (const values of alts[i].values()) {
      for (const v of values) {
        let rs = phraseCache.get(v);
        if (!rs) phraseCache.set(v, (rs = index.ms.search(v, SYNONYM_OPTIONS)));
        for (const r of rs) add(r, i, SYNONYM_WEIGHT);
      }
    }
  });

  const hits: Hit[] = [];
  for (const [slug, a] of acc) {
    if (a.words.size < qwords.length) continue;
    const viaTools = [...a.words.values()].filter((w) => [...w.fields].every((f) => TOOL_FIELDS.includes(f)));
    const onlyTools = viaTools.length === qwords.length;
    let tool: string | null = null;
    if (viaTools.length) {
      const best = bestTool(index, slug, viaTools.map((w) => w.terms));
      // Words found only through tools must all come from the same tool, not be scattered across many.
      if (viaTools.length >= 2 && best?.covers !== viaTools.length) continue;
      if (onlyTools) tool = best?.name ?? null;
    }
    hits.push({ slug, score: a.score, tool });
  }
  return hits.sort((x, y) => y.score - x.score);
}

/** The tool that covers the most query words (each given as its matched terms); tool names win ties. */
function bestTool(index: SearchIndex, slug: string, perWord: Set<string>[]): { name: string; covers: number } | null {
  const texts = new Map<string, string>();
  for (const t of index.bySlug.get(slug)?.tools.items ?? []) texts.set(t.name, t.name);
  for (const t of index.details[slug] ?? []) texts.set(t.name, `${t.name} ${t.title ?? ''} ${t.description ?? ''}`);
  let top: { name: string; covers: number; byName: boolean } | null = null;
  for (const [name, text] of texts) {
    const terms = new Set(tokenize(text).map(processTerm));
    const nameTerms = new Set(tokenize(name).map(processTerm));
    const covers = perWord.filter((ws) => [...ws].some((t) => terms.has(t))).length;
    const byName = perWord.some((ws) => [...ws].some((t) => nameTerms.has(t)));
    if (covers && (!top || covers > top.covers || (covers === top.covers && byName && !top.byName))) {
      top = { name, covers, byName };
    }
  }
  return top && { name: top.name, covers: top.covers };
}
