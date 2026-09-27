import type { LoginObserved, Server } from '../types';
import { isOwnerVerified, isReadOnly } from './labels';

export type LoginFilter = 'all' | Exclude<LoginObserved, 'unknown'>;

export interface Filters {
  login: LoginFilter;
  ownerVerified: boolean;
  readOnly: boolean;
  category: string;
}

export const DEFAULT_FILTERS: Filters = {
  login: 'all',
  ownerVerified: false,
  readOnly: false,
  category: '',
};

export const LOGIN_OPTIONS: { value: LoginFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'none', label: 'No login' },
  { value: 'oauth', label: 'OAuth' },
  { value: 'credentials', label: 'API key' },
];

export function applyFilters(list: Server[], f: Filters): Server[] {
  return list.filter(
    (s) =>
      (f.login === 'all' || s.login.observed === f.login) &&
      (!f.ownerVerified || isOwnerVerified(s)) &&
      (!f.readOnly || isReadOnly(s)) &&
      (!f.category || s.catalog.category === f.category),
  );
}

export function categories(servers: Server[]): string[] {
  const set = new Set<string>();
  for (const s of servers) if (s.catalog.category) set.add(s.catalog.category);
  return [...set].sort((a, b) => a.localeCompare(b, 'en'));
}
