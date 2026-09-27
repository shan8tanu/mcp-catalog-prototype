import { Fragment } from 'react';
import type { Server } from '../types';
import {
  CHECKED_TIP,
  STATUS_TEXT,
  STATUS_TONE,
  blockerChip,
  costText,
  hasBlocker,
  loginDisplay,
  owner,
  toolsText,
  type Tone,
} from '../lib/labels';
import { useCore } from '../state/data';
import { useUI } from '../state/ui';

function Mark({ tip = CHECKED_TIP }: { tip?: string }) {
  return (
    <span role="img" aria-label={tip} title={tip} className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
      ✓
    </span>
  );
}

export function Dash({ tip = 'Unknown' }: { tip?: string }) {
  return (
    <span title={tip} className="text-zinc-500 dark:text-zinc-400">
      <span aria-hidden="true">—</span>
      <span className="sr-only">{tip}</span>
    </span>
  );
}

const DOT: Record<Tone, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  grey: 'bg-zinc-400 dark:bg-zinc-500',
};

const TEXT: Record<Tone, string> = {
  green: 'text-green-700 dark:text-green-400',
  amber: 'text-amber-700 dark:text-amber-400',
  red: 'text-red-700 dark:text-red-400',
  grey: 'text-zinc-600 dark:text-zinc-400',
};

export function StatusValue({ s }: { s: Server }) {
  const tone = STATUS_TONE[s.status.state];
  return (
    <span className="inline-flex items-baseline">
      <span aria-hidden="true" className={`mr-1.5 inline-block h-2 w-2 shrink-0 self-center rounded-full ${DOT[tone]}`} />
      <span>
        <span className={TEXT[tone]}>{STATUS_TEXT[s.status.state]}</span>
        {s.status.state !== 'not_checked' && <Mark />}
      </span>
    </span>
  );
}

export function LoginValue({ s }: { s: Server }) {
  const { text, tip } = loginDisplay(s);
  if (!text) return <Dash />;
  if (tip) {
    return (
      <span className="whitespace-nowrap" title={tip}>
        {text}
        <span className="sr-only">: {tip}</span>
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap">
      {text}
      <Mark />
    </span>
  );
}

export function ToolsValue({ s }: { s: Server }) {
  return (
    <span className={s.tools.visibility === 'hidden' ? 'text-zinc-500 dark:text-zinc-400' : ''}>
      {toolsText(s)}
      {s.tools.visibility === 'verified' && <Mark />}
    </span>
  );
}

export function OwnerValue({ s }: { s: Server }) {
  const o = owner(s);
  return (
    <span title={o.tip ?? undefined} className="break-words">
      {o.text.split(/(?<=\.)/).map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {part}
        </Fragment>
      ))}
      {o.verified && <Mark tip={o.tip ?? CHECKED_TIP} />}
    </span>
  );
}

export function CostValue({ s }: { s: Server }) {
  const text = costText(s);
  if (!text) return <Dash />;
  return (
    <span className="whitespace-nowrap">
      {text}
      {s.cost.basis === 'checked' && <Mark />}
    </span>
  );
}

export function WrongLabelChip({ s }: { s: Server }) {
  if (!hasBlocker(s)) return null;
  return <span className="chip-warn">{blockerChip(s)}</span>;
}

export function SameServerAs({ s }: { s: Server }) {
  const { bySlug } = useCore();
  const { href } = useUI();
  const others = s.duplicates.same_endpoint_as.map((slug) => bySlug.get(slug)).filter((x): x is Server => !!x);
  if (!others.length) return null;
  return (
    <span>
      Same server as{' '}
      {others.map((o, i) => (
        <span key={o.slug}>
          {i > 0 && ', '}
          <a className="link relative z-10" href={href(`/server/${o.slug}`)}>
            {o.name}
          </a>
        </span>
      ))}
    </span>
  );
}
