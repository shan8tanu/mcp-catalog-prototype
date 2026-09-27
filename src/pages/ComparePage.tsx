import type { ReactNode } from 'react';
import type { Server } from '../types';
import { useCore } from '../state/data';
import { MAX_COMPARE, useUI } from '../state/ui';
import { STATUS_TEXT, costText, isRiskyScope, loginDisplay, owner, toolsText } from '../lib/labels';
import { CostValue, Dash, LoginValue, OwnerValue, StatusValue, ToolsValue } from '../components/Values';

function riskyScopes(s: Server): string[] | null {
  const scopes = s.login.oauth?.scopes;
  return scopes?.length ? scopes.filter(isRiskyScope) : null;
}

function PermissionsValue({ s }: { s: Server }) {
  const risky = riskyScopes(s);
  if (!risky) return <Dash tip="No OAuth permissions listed" />;
  if (!risky.length) return <span>No write or delete permissions</span>;
  return (
    <ul className="flex flex-wrap gap-1">
      {risky.map((x) => (
        <li key={x}>
          <code className="rounded border border-amber-400 bg-amber-50 px-1 py-px text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
            {x}
          </code>
        </li>
      ))}
    </ul>
  );
}

function CostCell({ s }: { s: Server }) {
  return (
    <>
      <CostValue s={s} />
      {s.cost.evidence && (
        <p className="mt-1 text-xs muted">
          {s.cost.evidence}
          {s.cost.basis === 'keyword' && ' (unverified)'}
        </p>
      )}
    </>
  );
}

interface CompareRow {
  label: string;
  /** Comparison key: rows are highlighted only when these differ. */
  key: (s: Server) => string;
  render: (s: Server) => ReactNode;
}

const ROWS: CompareRow[] = [
  { label: 'Status', key: (s) => STATUS_TEXT[s.status.state], render: (s) => <StatusValue s={s} /> },
  { label: 'Login', key: (s) => loginDisplay(s).text ?? '', render: (s) => <LoginValue s={s} /> },
  { label: 'Owner', key: (s) => owner(s).text, render: (s) => <OwnerValue s={s} /> },
  { label: 'Tools', key: (s) => toolsText(s), render: (s) => <ToolsValue s={s} /> },
  { label: 'Permissions', key: (s) => riskyScopes(s)?.join(' ') ?? '', render: (s) => <PermissionsValue s={s} /> },
  { label: 'Cost', key: (s) => costText(s) ?? '', render: (s) => <CostCell s={s} /> },
];

export function ComparePage() {
  const { bySlug } = useCore();
  const { selected, removeSelected, href } = useUI();
  const servers = selected.map((slug) => bySlug.get(slug)).filter((s): s is Server => !!s);
  const unknown = selected.filter((slug) => !bySlug.has(slug));

  return (
    <>
      <a href={href('/')} className="link text-sm">
        ← All servers
      </a>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Compare</h1>
      {unknown.length > 0 && (
        <p className="mt-2 text-sm muted">
          Not in this snapshot: {unknown.join(', ')}.{' '}
          {unknown.map((slug) => (
            <button key={slug} type="button" className="link mr-2" onClick={() => removeSelected(slug)}>
              Remove {slug}
            </button>
          ))}
        </p>
      )}

      {servers.length === 0 ? (
        <p className="mt-4 text-sm muted">
          Nothing selected. Tick “Compare” on up to {MAX_COMPARE} servers in the{' '}
          <a className="link" href={href('/')}>
            list
          </a>
          .
        </p>
      ) : (
        <div className="relative mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-28" />
              {servers.map((s) => (
                <col key={s.slug} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td />
                {servers.map((s) => (
                  <th key={s.slug} scope="col" className="px-3 py-2 text-left align-top">
                    <a href={href(`/server/${s.slug}`)} className="font-semibold hover:underline">
                      {s.name}
                    </a>
                    <button type="button" className="link ml-2 text-xs font-normal" onClick={() => removeSelected(s.slug)}>
                      Remove<span className="sr-only"> {s.name}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const differs = servers.length > 1 && new Set(servers.map(row.key)).size > 1;
                return (
                  <tr
                    key={row.label}
                    className={`border-b border-zinc-200 align-top dark:border-zinc-800 ${differs ? 'bg-sky-100/70 dark:bg-sky-500/15' : ''}`}
                  >
                    <th
                      scope="row"
                      className={`border-l-2 px-3 py-2.5 text-left font-medium muted ${differs ? 'border-sky-600 dark:border-sky-400' : 'border-transparent'}`}
                    >
                      {row.label}
                      {differs && <span className="sr-only"> (differs)</span>}
                    </th>
                    {servers.map((s) => (
                      <td key={s.slug} className="px-3 py-2.5 break-words">
                        {row.render(s)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
