import { useState, type ReactNode } from 'react';
import { MAX_COMPARE, useUI } from '../state/ui';

export function ExtLink({ href, children, className = 'link break-all' }: { href: string; children?: ReactNode; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children ?? href}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  return (
    <button
      type="button"
      className="btn px-2 py-1 text-xs"
      aria-label={state === 'idle' ? label : undefined}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState('ok');
        } catch {
          setState('fail');
        }
        window.setTimeout(() => setState('idle'), 2000);
      }}
    >
      {state === 'ok' ? 'Copied' : state === 'fail' ? 'Copy failed' : 'Copy'}
      <span className="sr-only" aria-live="polite">
        {state === 'ok' ? 'Copied to clipboard' : ''}
      </span>
    </button>
  );
}

export function CompareCheckbox({ slug, name }: { slug: string; name: string }) {
  const { selected, toggleSelected } = useUI();
  const on = selected.includes(slug);
  const full = !on && selected.length >= MAX_COMPARE;
  return (
    <label
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm ${full ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      title={full ? `Compare holds up to ${MAX_COMPARE} servers` : undefined}
    >
      <input
        type="checkbox"
        className="h-4 w-4 accent-sky-600"
        checked={on}
        disabled={full}
        onChange={() => toggleSelected(slug)}
      />
      <span aria-hidden="true">Compare</span>
      <span className="sr-only">Compare {name}</span>
    </label>
  );
}

export function CompareButton({ slug }: { slug: string }) {
  const { selected, toggleSelected } = useUI();
  const on = selected.includes(slug);
  const full = !on && selected.length >= MAX_COMPARE;
  return (
    <button
      type="button"
      className="btn"
      aria-pressed={on}
      disabled={full}
      title={full ? `Compare holds up to ${MAX_COMPARE} servers` : undefined}
      onClick={() => toggleSelected(slug)}
    >
      {on ? 'Added to compare ✓' : 'Add to compare'}
    </button>
  );
}
