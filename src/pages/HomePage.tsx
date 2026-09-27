import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Server } from '../types';
import { useCore, useData } from '../state/data';
import { useUI, type Sort } from '../state/ui';
import { search, type Hit } from '../lib/search';
import { DEFAULT_FILTERS, LOGIN_OPTIONS, applyFilters, categories, type Filters, type LoginFilter } from '../lib/filters';
import { SORT_VALUE, byName, fmtNum, isWorking, type SortKey } from '../lib/labels';
import { CostValue, LoginValue, OwnerValue, SameServerAs, StatusValue, ToolsValue, WrongLabelChip } from '../components/Values';
import { CompareCheckbox, ExtLink } from '../components/Primitives';

const PAGE = 50;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'MCP server' },
  { key: 'status', label: 'Status' },
  { key: 'login', label: 'Login' },
  { key: 'tools', label: 'Tools' },
  { key: 'owner', label: 'Owner' },
  { key: 'cost', label: 'Cost' },
];

/** Working servers with a visible tool list first, then the rest; each group by name. */
function defaultOrder(servers: Server[]): Server[] {
  const first = (s: Server) => (isWorking(s) && s.tools.visibility !== 'hidden' ? 0 : 1);
  return [...servers].sort((a, b) => first(a) - first(b) || byName(a, b));
}

/** Stable sort; unknown values stay last in both directions. */
function sortList(list: Server[], { key, dir }: Sort): Server[] {
  const value = SORT_VALUE[key];
  const m = dir === 'asc' ? 1 : -1;
  return list
    .map((s, i) => ({ s, i, v: value(s) }))
    .sort((a, b) => {
      if (a.v === null || b.v === null) return a.v === b.v ? a.i - b.i : a.v === null ? 1 : -1;
      const c = typeof a.v === 'number' && typeof b.v === 'number' ? a.v - b.v : String(a.v).localeCompare(String(b.v), 'en');
      return c * m || a.i - b.i;
    })
    .map((x) => x.s);
}

function nextSort(current: Sort | null, key: SortKey): Sort | null {
  if (current?.key !== key) return { key, dir: 'asc' };
  return current.dir === 'asc' ? { key, dir: 'desc' } : null;
}

function SearchBox() {
  const { route, patchHere, setSort } = useUI();
  const q = route.params.get('q') ?? '';
  const [value, setValue] = useState(q);

  useEffect(() => setValue(q), [q]);
  useEffect(() => {
    if (value === q) return;
    const t = window.setTimeout(() => {
      patchHere({ q: value.trim() ? value : null });
      setSort(null);
    }, 200);
    return () => window.clearTimeout(t);
  }, [value, q, patchHere, setSort]);

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="q" className="sr-only">
        Search MCP servers
      </label>
      <input
        id="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name or by what you need, e.g. seo audit"
        autoComplete="off"
        spellCheck={false}
        className="field w-full max-w-2xl px-3 py-2 text-base"
      />
    </form>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
        on
          ? 'border-sky-600 bg-sky-50 text-sky-900 dark:border-sky-500 dark:bg-sky-500/15 dark:text-sky-200'
          : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900'
      }`}
    >
      <span aria-hidden="true" className={`relative h-3.5 w-6 rounded-full ${on ? 'bg-sky-600 dark:bg-sky-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
        <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${on ? 'left-3' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-sm">
      <span className="muted">{label}</span>
      <select className="field py-1.5" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  );
}

function FilterRow({ cats }: { cats: string[] }) {
  const { filters, setFilters } = useUI();
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  return (
    <div role="group" aria-label="Filters" className="mt-3 flex flex-wrap items-center gap-2">
      <Select label="Login" value={filters.login} onChange={(v) => set({ login: v as LoginFilter })}>
        {LOGIN_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <Toggle label="Owner verified" on={filters.ownerVerified} onChange={(ownerVerified) => set({ ownerVerified })} />
      <Toggle label="Read-only tools" on={filters.readOnly} onChange={(readOnly) => set({ readOnly })} />
      <Select label="Category" value={filters.category} onChange={(category) => set({ category })}>
        <option value="">All</option>
        {cats.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
    </div>
  );
}

function SortHeader({ col }: { col: (typeof COLUMNS)[number] }) {
  const { sort, setSort } = useUI();
  const active = sort?.key === col.key;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="py-2 pr-2 text-left font-medium md:pr-3 lg:pr-4"
    >
      <button type="button" onClick={() => setSort(nextSort(sort, col.key))} className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white">
        {col.label}
        <span aria-hidden="true" className={active ? 'text-sky-700 dark:text-sky-400' : 'opacity-30'}>
          {active && sort.dir === 'desc' ? '↓' : '↑'}
        </span>
      </button>
    </th>
  );
}

function MobileSort({ hasQuery }: { hasQuery: boolean }) {
  const { sort, setSort } = useUI();
  const value = sort ? `${sort.key}:${sort.dir}` : '';
  return (
    <label className="inline-flex items-center gap-1.5 text-sm sm:hidden">
      <span className="muted">Sort</span>
      <select
        className="field py-1"
        value={value}
        onChange={(e) => {
          const [key, dir] = e.target.value.split(':');
          setSort(key ? { key: key as SortKey, dir: dir as Sort['dir'] } : null);
        }}
      >
        <option value="">{hasQuery ? 'Relevance' : 'Default'}</option>
        {COLUMNS.map((c) => (
          <option key={c.key} value={`${c.key}:asc`}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Prefix that labels a value once the row is stacked on small screens. */
function Cell({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <td className={`py-2.5 pr-2 md:pr-3 lg:pr-4 max-sm:p-0 ${className}`}>
      <span className="sr-only sm:hidden">{label}: </span>
      {children}
    </td>
  );
}

function Row({ s, hit }: { s: Server; hit: Hit | undefined }) {
  const { href } = useUI();
  const tool = hit?.tool;
  const hasNotes = s.login.flags.some((f) => f.level === 'blocker') || tool || s.duplicates.same_endpoint_as.length > 0;
  return (
    <tr className="border-b border-zinc-200 align-top hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60 max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-1 max-sm:py-3">
      <td className="max-w-md py-2.5 pr-2 md:pr-3 lg:pr-4 max-lg:wrap-anywhere max-sm:w-full max-sm:max-w-none max-sm:p-0">
        <a href={href(`/server/${s.slug}`)} className="font-semibold hover:underline">
          {s.name}
        </a>
        <p className="line-clamp-2 muted xl:line-clamp-1" title={s.description}>
          {s.description}
        </p>
        {hasNotes && (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs muted">
            <WrongLabelChip s={s} />
            {tool && (
              <span>
                matches tool: <code>{tool}</code>
              </span>
            )}
            <SameServerAs s={s} />
          </p>
        )}
      </td>
      <Cell label="Status" className="xl:whitespace-nowrap">
        <StatusValue s={s} />
      </Cell>
      <Cell label="Login" className="whitespace-nowrap">
        <LoginValue s={s} />
      </Cell>
      <Cell label="Tools" className="xl:whitespace-nowrap">
        <ToolsValue s={s} />
      </Cell>
      <Cell label="Owner">
        <OwnerValue s={s} />
      </Cell>
      <Cell label="Cost" className="whitespace-nowrap">
        <CostValue s={s} />
      </Cell>
      <td className="py-2.5 max-sm:w-full max-sm:p-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end">
          <ExtLink href={s.connect.catalog_page} className="link whitespace-nowrap">
            Try it ↗
          </ExtLink>
          <CompareCheckbox slug={s.slug} name={s.name} />
        </div>
      </td>
    </tr>
  );
}

export function HomePage() {
  const { servers, bySlug, synonyms } = useCore();
  const { index } = useData();
  const { route, filters, setFilters, sort } = useUI();
  const q = (route.params.get('q') ?? '').trim();
  const [limit, setLimit] = useState(PAGE);

  const cats = useMemo(() => categories(servers), [servers]);
  const ordered = useMemo(() => defaultOrder(servers), [servers]);
  const hits = useMemo(() => (q && index ? search(index, q, synonyms) : null), [q, index, synonyms]);
  const hitBySlug = useMemo(() => new Map((hits ?? []).map((h) => [h.slug, h])), [hits]);
  const waiting = !!q && !index;

  const base = useMemo(
    () => (hits ? hits.map((h) => bySlug.get(h.slug)).filter((s): s is Server => !!s) : q ? [] : ordered),
    [hits, bySlug, q, ordered],
  );
  const shown = useMemo(() => applyFilters(base, filters), [base, filters]);
  const rows = useMemo(() => (sort ? sortList(shown, sort) : shown), [shown, sort]);

  useEffect(() => setLimit(PAGE), [q, filters, sort]);

  const filtered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <>
      <h1 className="sr-only">MCP servers</h1>
      <SearchBox />
      <FilterRow cats={cats} />

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-sm" aria-live="polite">
          {waiting ? (
            <span className="muted">Loading search…</span>
          ) : (
            <>
              <strong>{fmtNum(rows.length)}</strong> {rows.length === 1 ? 'server' : 'servers'}
            </>
          )}
        </p>
        <MobileSort hasQuery={!!q} />
      </div>

      <div className="relative mt-2 overflow-x-auto">
        <table className="w-full text-sm max-sm:block">
          <thead className="border-b border-zinc-200 text-xs muted dark:border-zinc-800 max-sm:hidden">
            <tr>
              {COLUMNS.map((c) => (
                <SortHeader key={c.key} col={c} />
              ))}
              <th scope="col" className="py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="max-sm:block">
            {waiting
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={i} className="max-sm:block">
                    <td colSpan={7} className="py-1.5 max-sm:block">
                      <div className="skeleton h-10" />
                    </td>
                  </tr>
                ))
              : rows.slice(0, limit).map((s) => <Row key={s.slug} s={s} hit={hitBySlug.get(s.slug)} />)}
          </tbody>
        </table>
      </div>

      {!waiting && rows.length === 0 && (
        <div className="py-10 text-center text-sm">
          <p className="font-medium">No servers match{q ? ` “${q}”` : ''}.</p>
          <p className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 muted">
            {filtered && (
              <button type="button" className="link" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear filters
              </button>
            )}
            {q && <span>Try fewer or different words.</span>}
          </p>
        </div>
      )}

      {rows.length > limit && (
        <div className="mt-4 text-center">
          <button type="button" className="btn" onClick={() => setLimit((l) => l + PAGE)}>
            Show more ({fmtNum(rows.length - limit)} left)
          </button>
        </div>
      )}
    </>
  );
}
