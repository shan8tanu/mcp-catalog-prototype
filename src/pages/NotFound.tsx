import { useUI } from '../state/ui';

export function NotFound({ what = 'page' }: { what?: string }) {
  const { href } = useUI();
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold">We couldn't find that {what}.</h1>
      <p className="mt-2 text-sm muted">The link may be mistyped, or the {what} isn't in this data snapshot.</p>
      <a className="btn mt-6" href={href('/')}>
        Back to all servers
      </a>
    </div>
  );
}
