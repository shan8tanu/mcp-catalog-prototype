import type { Access, LoginObserved, Server, StatusState } from '../types';

/* Display values follow section 4 of docs/01-product-spec.md. */

export const SNAPSHOT_DATE = '27 Sep 2026';
export const CHECKED_TIP = `Checked ${SNAPSHOT_DATE}`;

// Dates render in IST, the time zone the snapshot is dated in, with fixed month names
// because browser locale data varies ("Sep" vs "Sept").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function parts(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = Object.fromEntries(PARTS.formatToParts(d).map((x) => [x.type, x.value]));
  return { day: Number(p.day), month: MONTHS[Number(p.month) - 1], year: p.year, time: `${p.hour}:${p.minute}` };
}

export function fmtDay(iso: string | null | undefined): string | null {
  const p = iso ? parts(iso) : null;
  return p ? `${p.day} ${p.month}` : null;
}

export function fmtDateTime(iso: string | null | undefined): string | null {
  const p = iso ? parts(iso) : null;
  return p ? `${p.day} ${p.month} ${p.year}, ${p.time} IST` : null;
}

export function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

export type Tone = 'green' | 'amber' | 'red' | 'grey';

export const STATUS_TEXT: Record<StatusState, string> = {
  up: 'Up',
  up_direct_but_catalog_failed: "Up · catalog can't connect",
  failing: 'Failing',
  payment_or_quota: 'Payment or quota error',
  not_checked: 'Not checked',
};

export const STATUS_TONE: Record<StatusState, Tone> = {
  up: 'green',
  up_direct_but_catalog_failed: 'amber',
  failing: 'red',
  payment_or_quota: 'red',
  not_checked: 'grey',
};

const STATUS_RANK: Record<StatusState, number> = {
  up: 0,
  up_direct_but_catalog_failed: 1,
  not_checked: 2,
  payment_or_quota: 3,
  failing: 4,
};

const WORKING: StatusState[] = ['up', 'up_direct_but_catalog_failed', 'not_checked'];

export function isWorking(s: Server): boolean {
  return WORKING.includes(s.status.state);
}

export const LOGIN_TEXT: Record<LoginObserved, string | null> = {
  none: 'No login',
  oauth: 'OAuth',
  credentials: 'API key',
  unknown: null,
};

const LOGIN_RANK: Record<LoginObserved, number> = { none: 0, oauth: 2, credentials: 3, unknown: 4 };

const CLAIMED_LOGIN: Record<string, string> = { 'API Key': 'API key', OAuth2: 'OAuth' };

/** The catalog asks for a login, but the server listed its tools without one. */
export function isMixedLogin(s: Server): boolean {
  return s.login.observed === 'none' && s.login.claimed in CLAIMED_LOGIN;
}

export function loginDisplay(s: Server): { text: string | null; tip: string | null } {
  if (isMixedLogin(s)) {
    const claimed = CLAIMED_LOGIN[s.login.claimed];
    return {
      text: 'Mixed',
      tip: `Tools are listed without login; the catalog says ${claimed}, so some tools may still need one`,
    };
  }
  return { text: LOGIN_TEXT[s.login.observed], tip: null };
}

export function hasBlocker(s: Server): boolean {
  return s.login.flags.some((f) => f.level === 'blocker');
}

export function blockerChip(s: Server): string {
  return `Listed as ${s.login.claimed} · needs login`;
}

export function toolsText(s: Server): string {
  const t = s.tools;
  if (t.visibility === 'hidden') return 'After login';
  const spend = t.access_counts.spends_money ?? 0;
  const write = (t.access_counts.write ?? 0) + (t.access_counts.destructive ?? 0);
  const parts = [fmtNum(t.count)];
  if (write) parts.push(`${write} can write`);
  if (spend) parts.push(`${spend} can spend money`);
  return parts.join(' · ');
}

const TWO_LEVEL_SUFFIXES = new Set(['co.uk', 'org.uk', 'ac.uk', 'com.au', 'co.jp', 'co.in', 'com.br', 'co.nz', 'co.za']);

export function registrableDomain(host: string): string {
  const labels = host.toLowerCase().split('.').filter(Boolean);
  const n = TWO_LEVEL_SUFFIXES.has(labels.slice(-2).join('.')) ? 3 : 2;
  return labels.slice(-n).join('.');
}

export interface Owner {
  text: string;
  verified: boolean;
  tip: string | null;
}

export function owner(s: Server): Owner {
  const reg = s.operator.registry?.owner;
  const domain = registrableDomain(s.host);
  switch (s.operator.label) {
    case 'verified_domain':
      return { text: reg ?? domain, verified: true, tip: 'Ownership proven in the Official MCP Registry' };
    case 'verified_domain_elsewhere':
      return { text: reg ?? domain, verified: true, tip: `Ownership proven; server runs on ${s.host}` };
    case 'verified_github':
      return { text: reg ? `@${reg}` : domain, verified: true, tip: 'GitHub account proven in the Official MCP Registry' };
    case 'vendor_documented': {
      const vendor = /^Run by (.+?)\s*\(/.exec(s.operator.text)?.[1] ?? domain;
      return { text: vendor, verified: true, tip: `Confirmed in the vendor's docs; server at ${s.host}` };
    }
    case 'vendor_domain':
      return { text: domain, verified: false, tip: "Runs on the vendor's domain; not formally verified" };
    case 'truefoundry_hosted':
      return { text: 'Hosted by TrueFoundry', verified: false, tip: s.operator.text };
    case 'truefoundry_demo':
      return { text: 'Demo', verified: false, tip: 'Sample data, for trying only' };
    default:
      return { text: 'Unverified', verified: false, tip: null };
  }
}

export function isOwnerVerified(s: Server): boolean {
  return ['verified_domain', 'verified_github', 'vendor_documented'].includes(s.operator.label);
}

const COST_TEXT: Partial<Record<Server['cost']['type'], string>> = {
  free: 'Free',
  free_tier: 'Free tier',
  paid_plan: 'Paid plan',
  per_call: 'Per call',
};

const COST_RANK: Record<string, number> = { Free: 0, 'Free tier': 1, 'Per call': 2, 'Paid plan': 3 };

/** Cost is shown only when it comes from vendor docs or our own check; keyword guesses are not shown. */
export function costText(s: Server): string | null {
  if (s.cost.basis !== 'manual' && s.cost.basis !== 'checked') return null;
  return COST_TEXT[s.cost.type] ?? null;
}

export function isReadOnly(s: Server): boolean {
  return s.tools.visibility !== 'hidden' && s.tools.items.length > 0 && s.tools.items.every((t) => t.access === 'read');
}

export function isRiskyScope(scope: string): boolean {
  return /write|delete/i.test(scope);
}

export function isUrl(s: string | null | undefined): s is string {
  return !!s && /^https?:\/\//i.test(s);
}

export const ACCESS_TAG: Partial<Record<Access, string>> = {
  write: 'Can write',
  destructive: 'Destructive',
  spends_money: 'Spends money',
};

/** Sort key for names: leading symbols and emoji are ignored. */
export function nameKey(name: string): string {
  return name.replace(/^[^\p{L}\p{N}]+/u, '').toLowerCase();
}

export function byName(a: Server, b: Server): number {
  return nameKey(a.name).localeCompare(nameKey(b.name), 'en') || a.slug.localeCompare(b.slug);
}

export type SortKey = 'name' | 'status' | 'login' | 'tools' | 'owner' | 'cost';

/** Sort values per column; `null` always sorts last, in either direction. */
export const SORT_VALUE: Record<SortKey, (s: Server) => number | string | null> = {
  name: (s) => nameKey(s.name),
  status: (s) => STATUS_RANK[s.status.state],
  login: (s) => (s.login.observed === 'unknown' ? null : isMixedLogin(s) ? 1 : LOGIN_RANK[s.login.observed]),
  tools: (s) => (s.tools.visibility === 'hidden' ? null : s.tools.count),
  owner: (s) => owner(s).text.replace(/^@/, '').toLowerCase(),
  cost: (s) => {
    const c = costText(s);
    return c ? COST_RANK[c] : null;
  },
};
