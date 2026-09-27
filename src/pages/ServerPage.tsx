import { useState, type ReactNode } from 'react';
import type { Access, Server, ToolDetail } from '../types';
import { useCore, useData } from '../state/data';
import { useUI } from '../state/ui';
import { ACCESS_TAG, fmtDateTime, fmtDay, fmtNum, hasBlocker, isRiskyScope, isUrl } from '../lib/labels';
import { CostValue, LoginValue, OwnerValue, SameServerAs, StatusValue, ToolsValue, WrongLabelChip } from '../components/Values';
import { CompareButton, CopyButton, ExtLink } from '../components/Primitives';
import { NotFound } from './NotFound';

const TOOL_PAGE = 15;

const TAG_STYLE: Partial<Record<Access, string>> = {
  write: 'border-amber-400 text-amber-800 dark:border-amber-700 dark:text-amber-300',
  destructive: 'border-red-400 text-red-800 dark:border-red-800 dark:text-red-300',
  spends_money: 'border-red-400 text-red-800 dark:border-red-800 dark:text-red-300',
};

function Section({ id, title, children }: { id: string; title: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-base font-semibold">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function firstLine(text: string | null | undefined): string | null {
  if (!text) return null;
  const line = text.trim().split(/\n|(?<=[.!?])\s/)[0].trim();
  return line.length > 180 ? `${line.slice(0, 177)}…` : line;
}

function toolsNote(s: Server): string {
  const t = s.tools;
  const parts: string[] = [];
  if (t.visibility === 'verified') {
    const day = fmtDay(t.listed_at);
    parts.push(day ? `Listed by the server on ${day}` : 'Listed by the server');
  } else if (t.visibility === 'catalog_only') parts.push('Names from the catalog; not verified');
  else parts.push('Visible only after login');
  if (t.est_definition_tokens) parts.push(`about ${fmtNum(Math.round(t.est_definition_tokens / 100) * 100)} tokens of context`);
  const inferred = t.items.filter((i) => i.access_basis === 'inferred').length;
  if (inferred) parts.push(inferred === t.items.length ? 'access tags guessed from tool names' : 'some access tags guessed from tool names');
  return parts.join(' · ');
}

function Tools({ s }: { s: Server }) {
  const { toolDetails } = useData();
  const [all, setAll] = useState(false);
  const detail = new Map<string, ToolDetail>((toolDetails?.[s.slug] ?? []).map((d) => [d.name, d]));
  const items = s.tools.items;
  const shown = all ? items : items.slice(0, TOOL_PAGE);
  const hidden = s.tools.visibility === 'hidden';
  return (
    <Section id="tools" title={hidden ? 'Tools' : `Tools · ${fmtNum(s.tools.count)}`}>
      <p className="text-xs muted">{toolsNote(s)}</p>
      {items.length > 0 && (
        <ul className="panel mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
          {shown.map((t) => {
            const tag = ACCESS_TAG[t.access];
            const d = detail.get(t.name);
            const desc = firstLine(d?.description ?? d?.title);
            return (
              <li key={t.name} className="px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-medium break-all">{t.name}</code>
                  {tag && <span className={`tag ${TAG_STYLE[t.access]}`}>{tag}</span>}
                </div>
                {desc && <p className="mt-0.5 muted">{desc}</p>}
                {d && d.inputs.length > 0 && (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">inputs: {d.inputs.join(', ')}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {items.length > TOOL_PAGE && (
        <button type="button" className="btn mt-2" onClick={() => setAll(!all)} aria-expanded={all}>
          {all ? 'Show fewer' : `Show all ${fmtNum(items.length)}`}
        </button>
      )}
    </Section>
  );
}

function Permissions({ s }: { s: Server }) {
  const [all, setAll] = useState(false);
  const oauth = s.login.oauth;
  if (s.login.observed !== 'oauth' || !oauth) return null;
  const scopes = oauth.scopes ?? [];
  const risky = scopes.filter(isRiskyScope);
  const rest = scopes.filter((x) => !isRiskyScope(x));
  const hosts = (oauth.authorization_servers ?? []).map((h) => {
    try {
      return new URL(h).host || h;
    } catch {
      return h;
    }
  });
  return (
    <Section id="permissions" title="Permissions">
      <p className="text-sm">{hosts.length ? `Signs in with ${hosts.join(', ')}` : 'Signs in with OAuth'}</p>
      {scopes.length === 0 ? (
        <p className="mt-1 text-sm muted">The server doesn't list the permissions it requests.</p>
      ) : (
        <>
          <p className="mt-2 text-xs muted">
            {risky.length
              ? `${risky.length} of ${scopes.length} permissions can write or delete`
              : `${scopes.length} ${scopes.length === 1 ? 'permission' : 'permissions'} listed; none can write or delete`}
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {risky.map((x) => (
              <li key={x}>
                <code className="rounded border border-amber-400 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                  {x}
                </code>
              </li>
            ))}
            {all &&
              rest.map((x) => (
                <li key={x}>
                  <code className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-700">{x}</code>
                </li>
              ))}
          </ul>
          {rest.length > 0 && (
            <button type="button" className="link mt-2 text-sm" onClick={() => setAll(!all)} aria-expanded={all}>
              {all ? 'Show fewer' : `Show all ${scopes.length}`}
            </button>
          )}
        </>
      )}
    </Section>
  );
}

function Connect({ s }: { s: Server }) {
  const config = JSON.stringify(s.connect.direct, null, 2);
  return (
    <Section id="connect" title="Connect">
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-3 py-1.5 text-xs muted dark:border-zinc-800">
          <span>
            Paste into <code>.cursor/mcp.json</code>
          </span>
          <CopyButton text={config} label="Copy Cursor config" />
        </div>
        <pre className="overflow-x-auto bg-zinc-50 p-3 text-xs dark:bg-zinc-900">
          <code>{config}</code>
        </pre>
      </div>
      <p className="mt-3 text-sm">Or connect through TrueFoundry MCP Gateway (central login, access control, logs)</p>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
          {s.connect.via_gateway_url}
        </code>
        <CopyButton text={s.connect.via_gateway_url} label="Copy gateway URL" />
      </div>
    </Section>
  );
}

function Text({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="muted">—</span>;
  return isUrl(value) ? <ExtLink href={value} /> : <>{value}</>;
}

function Details({ s }: { s: Server }) {
  const { bySlug } = useCore();
  const { href } = useUI();
  const reg = s.operator.registry;
  const infoFlags = s.login.flags.filter((f) => f.level === 'info');
  const rows: [string, ReactNode][] = [
    [
      'Checks',
      <ul className="space-y-1">
        {s.status.checks.map((c, i) => (
          <li key={i}>
            <span className={c.ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>{c.ok ? 'OK' : 'Failed'}</span>
            {' · '}
            {c.source} · {fmtDateTime(c.at) ?? '—'}
            <br />
            <span className="muted">{c.detail}</span>
          </li>
        ))}
        {s.status.checks.length === 0 && <li className="muted">Not checked</li>}
      </ul>,
    ],
    [
      'Official MCP Registry',
      reg ? (
        <>
          <code>{reg.name}</code> · owner {reg.method === 'github' ? `@${reg.owner} (GitHub)` : `${reg.owner} (domain)`} · {reg.status} · v{reg.version}
          {reg.last_published && <> · last published {fmtDay(reg.last_published)}</>}
          {reg.repository && (
            <>
              {' · '}
              <ExtLink href={reg.repository}>repository</ExtLink>
            </>
          )}
        </>
      ) : (
        <span className="muted">No matching entry</span>
      ),
    ],
    [
      'Owner',
      <>
        {s.operator.text}
        {s.operator.evidence && (
          <>
            {' · '}
            <Text value={s.operator.evidence} />
          </>
        )}
      </>,
    ],
    [
      'Catalog',
      <>
        Auth label “{s.catalog.auth_label}” · category {s.catalog.category ?? '—'}
        {infoFlags.map((f, i) => (
          <span key={i} className="block muted">
            {f.text}
          </span>
        ))}
      </>,
    ],
    ['Endpoint', <code className="break-all">{s.server_url}</code>],
  ];
  if (s.cost.evidence || s.cost.source) {
    rows.push([
      s.cost.basis === 'keyword' ? 'Pricing mention (unverified)' : 'Cost evidence',
      <>
        <Text value={s.cost.evidence} />
        {s.cost.source && (
          <>
            {' · '}
            <ExtLink href={s.cost.source}>source</ExtLink>
          </>
        )}
      </>,
    ]);
  }
  const possible = s.duplicates.possible_duplicates.map((x) => bySlug.get(x)).filter((x): x is Server => !!x);
  if (possible.length || s.duplicates.note) {
    rows.push([
      'Similar listings',
      <>
        {possible.map((p, i) => (
          <span key={p.slug}>
            {i > 0 && ', '}
            <a className="link" href={href(`/server/${p.slug}`)}>
              {p.name}
            </a>
          </span>
        ))}
        {s.duplicates.note && <span className="block muted">{s.duplicates.note}</span>}
      </>,
    ]);
  }
  return (
    <details className="panel mt-8 group">
      <summary className="cursor-pointer select-none px-3 py-2 text-base font-semibold">Details</summary>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 border-t border-zinc-200 px-3 py-3 text-sm dark:border-zinc-800 sm:grid-cols-[11rem_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-medium muted">{k}</dt>
            <dd className="min-w-0 break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function Value({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-xs muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function ServerPage({ slug }: { slug: string }) {
  const { bySlug } = useCore();
  const { href } = useUI();
  const s = bySlug.get(slug);
  if (!s) return <NotFound what="server" />;
  const blocker = s.login.flags.find((f) => f.level === 'blocker');
  const hasDup = s.duplicates.same_endpoint_as.length > 0;
  return (
    <article className="max-w-4xl">
      <a href={href('/')} className="link text-sm">
        ← All servers
      </a>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{s.name}</h1>
      <p className="mt-1 muted">{s.description}</p>

      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        <Value label="Status">
          <StatusValue s={s} />
        </Value>
        <Value label="Login">
          <LoginValue s={s} />
        </Value>
        <Value label="Tools">
          <ToolsValue s={s} />
        </Value>
        <Value label="Owner">
          <OwnerValue s={s} />
        </Value>
        <Value label="Cost">
          <CostValue s={s} />
        </Value>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <ExtLink href={s.connect.catalog_page} className="btn-accent">
          Try it in the playground ↗
        </ExtLink>
        <ExtLink href={s.connect.catalog_page} className="btn">
          Scan for security issues ↗
        </ExtLink>
        <CompareButton slug={s.slug} />
      </div>

      {(hasBlocker(s) || hasDup || s.notes) && (
        <div className="mt-4 space-y-2 text-sm">
          {blocker && (
            <p role="note" className="flex flex-wrap items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              <WrongLabelChip s={s} />
              <span>{s.notes ?? blocker.text}</span>
            </p>
          )}
          {hasDup && (
            <p>
              <SameServerAs s={s} />
            </p>
          )}
          {s.notes && !blocker && <p className="muted">{s.notes}</p>}
        </div>
      )}

      <Tools s={s} />
      <Permissions s={s} />
      <Connect s={s} />
      <Details s={s} />
    </article>
  );
}
