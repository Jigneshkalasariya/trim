import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');

  return (
    <section className="surface rounded-[2rem] p-6 sm:p-8 lg:p-10">
      <div className="grid gap-10 grid-cols-1">
        <div className="space-y-5">
          <span className="section-kicker">404</span>
          <div className="space-y-3">
            <h1 className="font-heading text-[clamp(2.75rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-tight text-foreground">
              That link does not exist.
            </h1>
            <p className="max-w-xl text-[0.98rem] leading-6 text-muted-foreground sm:text-base">
              {code ? (
                <>
                  We could not find the short code{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {code}
                  </span>
                  .
                </>
              ) : (
                <>
                  We could not find a matching short code or page at this
                  address.
                </>
              )}{' '}
              Go back home to view your links or create a new one.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/">
                <span className="text-white">Go home</span>
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">View links</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="metric-card stats-card">
            <div className="metric-label">Status</div>
            <div className="metric-value">404</div>
            <div className="metric-note">Page not found</div>
          </div>
          <div className="metric-card stats-card">
            <div className="metric-label">Next step</div>
            <div className="metric-value">Home</div>
            <div className="metric-note">Return to your dashboard</div>
          </div>
          <div className="metric-card stats-card">
            <div className="metric-label">Action</div>
            <div className="metric-value">Link</div>
            <div className="metric-note">Browse your URLs</div>
          </div>
        </div>
      </div>
    </section>
  );
}
