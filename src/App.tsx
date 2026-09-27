import { useEffect, useRef } from 'react';
import { DataProvider, useData } from './state/data';
import { UIProvider, useUI } from './state/ui';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ServerPage } from './pages/ServerPage';
import { ComparePage } from './pages/ComparePage';
import { NotFound } from './pages/NotFound';

function Routes() {
  const { route } = useUI();
  const { core } = useData();
  const { path } = route;
  const prevPath = useRef(path);
  const slug = path.startsWith('/server/') ? decodeURIComponent(path.slice('/server/'.length)) : null;

  useEffect(() => {
    if (prevPath.current !== path) {
      window.scrollTo(0, 0);
      prevPath.current = path;
    }
    const page = slug ? core?.bySlug.get(slug)?.name ?? 'Server' : path === '/compare' ? 'Compare' : path === '/' ? null : 'Not found';
    document.title = page ? `${page} · MCP Catalog prototype` : 'MCP Catalog prototype';
  }, [path, slug, core]);

  if (path === '/') return <HomePage />;
  if (slug) return <ServerPage slug={slug} />;
  if (path === '/compare') return <ComparePage />;
  return <NotFound />;
}

export function App() {
  return (
    <DataProvider>
      <UIProvider>
        <Layout>
          <Routes />
        </Layout>
      </UIProvider>
    </DataProvider>
  );
}
