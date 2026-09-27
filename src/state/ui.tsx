import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNav, useRoute, type ParamPatch, type Route } from '../lib/router';
import { DEFAULT_FILTERS, type Filters } from '../lib/filters';
import type { SortKey } from '../lib/labels';

export const MAX_COMPARE = 3;

export interface Sort {
  key: SortKey;
  dir: 'asc' | 'desc';
}

interface UI {
  route: Route;
  href: (path: string, patch?: ParamPatch) => string;
  patchHere: (patch: ParamPatch) => void;
  selected: string[];
  toggleSelected: (slug: string) => void;
  removeSelected: (slug: string) => void;
  filters: Filters;
  setFilters: (f: Filters | ((f: Filters) => Filters)) => void;
  sort: Sort | null;
  setSort: (s: Sort | null) => void;
}

const UIContext = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const route = useRoute();
  const { href, patchHere } = useNav(route);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<Sort | null>(null);

  const raw = route.params.get('s');
  const selected = useMemo(
    () => [...new Set((raw ?? '').split(',').map((x) => x.trim()).filter(Boolean))].slice(0, MAX_COMPARE),
    [raw],
  );

  const write = useCallback((list: string[]) => patchHere({ s: list.join(',') || null }), [patchHere]);

  const toggleSelected = useCallback(
    (slug: string) => {
      if (selected.includes(slug)) write(selected.filter((s) => s !== slug));
      else if (selected.length < MAX_COMPARE) write([...selected, slug]);
    },
    [selected, write],
  );

  const removeSelected = useCallback((slug: string) => write(selected.filter((s) => s !== slug)), [selected, write]);

  const value: UI = {
    route,
    href,
    patchHere,
    selected,
    toggleSelected,
    removeSelected,
    filters,
    setFilters,
    sort,
    setSort,
  };
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UI {
  const ui = useContext(UIContext);
  if (!ui) throw new Error('useUI outside UIProvider');
  return ui;
}
