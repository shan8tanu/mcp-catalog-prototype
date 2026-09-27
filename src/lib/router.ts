import { useCallback, useEffect, useState } from 'react';

export interface Route {
  path: string;
  params: URLSearchParams;
}

/** Params that follow the user across pages: the compare selection. */
const GLOBAL_PARAMS = ['s'] as const;

const EVENT = 'app:locationchange';

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const i = raw.indexOf('?');
  const path = (i === -1 ? raw : raw.slice(0, i)) || '/';
  const params = new URLSearchParams(i === -1 ? '' : raw.slice(i + 1));
  return { path: path.startsWith('/') ? path : `/${path}`, params };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    window.addEventListener(EVENT, on);
    return () => {
      window.removeEventListener('hashchange', on);
      window.removeEventListener(EVENT, on);
    };
  }, []);
  return route;
}

export type ParamPatch = Record<string, string | null | undefined>;

function buildHash(path: string, params: URLSearchParams): string {
  const q = params.toString().replace(/%2C/gi, ',');
  return `#${path}${q ? `?${q}` : ''}`;
}

function apply(params: URLSearchParams, patch: ParamPatch) {
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === '') params.delete(k);
    else params.set(k, v);
  }
}

function go(hash: string, replace: boolean) {
  if (replace) {
    window.history.replaceState(null, '', hash);
    window.dispatchEvent(new Event(EVENT));
  } else {
    window.location.hash = hash;
  }
}

export function useNav(route: Route) {
  /** Link to `path`, carrying the global params and applying `patch`. */
  const href = useCallback(
    (path: string, patch: ParamPatch = {}) => {
      const next = new URLSearchParams();
      for (const k of GLOBAL_PARAMS) {
        const v = route.params.get(k);
        if (v) next.set(k, v);
      }
      apply(next, patch);
      return buildHash(path, next);
    },
    [route.params],
  );
  /** Same path, all current params kept, patch applied, without a new history entry. */
  const patchHere = useCallback(
    (patch: ParamPatch) => {
      const next = new URLSearchParams(route.params);
      apply(next, patch);
      go(buildHash(route.path, next), true);
    },
    [route],
  );
  return { href, patchHere };
}
