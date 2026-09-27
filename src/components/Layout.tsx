import type { ReactNode } from 'react';
import { useData } from '../state/data';
import { MAX_COMPARE, useUI } from '../state/ui';

function Header() {
  const { href, selected } = useUI();
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 px-4">
        <a href={href('/')} className="text-base font-semibold tracking-tight">
          MCP Catalog<span className="font-normal muted">, prototype</span>
        </a>
        {selected.length > 0 && (
          <a href={href('/compare')} className="btn-accent ml-auto py-1">
            Compare ({selected.length}/{MAX_COMPARE})
          </a>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-zinc-200 dark:border-zinc-800">
      <p className="mx-auto max-w-7xl px-4 py-5 text-xs muted">
        Independent prototype · data snapshot 27 Sep 2026 · not affiliated with TrueFoundry
      </p>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { core, error } = useData();
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only-focusable absolute left-2 top-2 z-50 rounded bg-white px-3 py-2 text-sm font-medium shadow dark:bg-zinc-900"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 outline-none">
        {core ? (
          children
        ) : error ? (
          <div role="alert" className="panel border-red-300 p-4 text-red-800 dark:border-red-800 dark:text-red-300">
            <p className="font-semibold">The data could not be loaded.</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : (
          <div aria-busy="true">
            <p className="sr-only">Loading servers…</p>
            <div className="skeleton mb-4 h-10 w-full max-w-2xl" />
            <div className="skeleton mb-4 h-8 w-full max-w-3xl" />
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton mb-2 h-12" />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
