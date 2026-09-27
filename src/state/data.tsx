import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Server, Synonyms, ToolDetails } from '../types';
import { buildIndex, type SearchIndex } from '../lib/search';

export interface CoreData {
  servers: Server[];
  bySlug: Map<string, Server>;
  synonyms: Synonyms;
}

interface DataState {
  core: CoreData | null;
  toolDetails: ToolDetails | null;
  index: SearchIndex | null;
  error: string | null;
}

const DataContext = createContext<DataState>({ core: null, toolDetails: null, index: null, error: null });

const base = import.meta.env.BASE_URL;

async function load<T>(file: string): Promise<T> {
  const res = await fetch(`${base}data/${file}`);
  if (!res.ok) throw new Error(`Could not load ${file} (HTTP ${res.status})`);
  return res.json() as Promise<T>;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ core: null, toolDetails: null, index: null, error: null });

  useEffect(() => {
    let cancelled = false;
    const fail = (e: unknown) => {
      if (!cancelled) setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }));
    };

    const detailsP = load<ToolDetails>('tool-details.json');
    const coreP = Promise.all([load<Server[]>('servers.json'), load<Synonyms>('synonyms.json')]).then(
      ([servers, synonyms]) => {
        const core: CoreData = { servers, bySlug: new Map(servers.map((s) => [s.slug, s])), synonyms };
        performance.mark('data:core');
        if (!cancelled) setState((s) => ({ ...s, core }));
        return core;
      },
    );
    coreP.catch(fail);

    Promise.all([coreP, detailsP])
      .then(([core, details]) => {
        if (cancelled) return;
        performance.mark('data:details');
        setState((s) => ({ ...s, toolDetails: details }));
        // Let the browser paint the table before indexing.
        setTimeout(() => {
          if (cancelled) return;
          const index = buildIndex(core.servers, details);
          performance.mark('data:index');
          setState((s) => ({ ...s, index }));
        }, 0);
      })
      .catch(fail);

    return () => {
      cancelled = true;
    };
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}

/** For components rendered only after core data has loaded. */
export function useCore(): CoreData {
  const { core } = useContext(DataContext);
  if (!core) throw new Error('Core data not loaded');
  return core;
}
