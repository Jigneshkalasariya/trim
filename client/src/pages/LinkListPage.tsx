import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ApiError, getAllUrls, type UrlWithClicks } from '@/api/trim';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}…`;
}

function formatCreatedDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function LinkListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="surface rounded-[1.75rem] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-14 w-full max-w-2xl" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[32rem]">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="metric-card">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-8 w-16" />
                <Skeleton className="mt-2 h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface rounded-[1.5rem] p-2 sm:p-3">
        <div className="overflow-hidden rounded-[1.15rem]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short code</TableHead>
                <TableHead>Original URL</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-56" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function LinkListPage() {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [urls, setUrls] = useState<UrlWithClicks[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const totalClicks = urls.reduce((sum, url) => sum + url.clickCount, 0);
  const mostClicked = urls.reduce<UrlWithClicks | null>((current, url) => {
    if (!current || url.clickCount > current.clickCount) {
      return url;
    }

    return current;
  }, null);

  useEffect(() => {
    let cancelled = false;

    async function loadUrls() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAllUrls();
        if (!cancelled) {
          setUrls(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Failed to load links',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadUrls();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function copyShortUrl(shortUrl: string, shortCode: string) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedCode(shortCode);
      window.setTimeout(() => {
        setCopiedCode((current) => (current === shortCode ? null : current));
      }, 2000);
    } catch {
      setError('Failed to copy short URL');
    }
  }

  if (isLoading) {
    return <LinkListSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="surface rounded-[1.75rem] p-8 sm:p-12">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span className="section-kicker">Empty library</span>
          <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
            No links yet
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            Use the{' '}
            <span className="font-medium text-foreground">Shorten URL</span>{' '}
            button in the header to create your first link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-[1.75rem] p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="max-w-full space-y-4">
            <span className="section-kicker">Link library</span>
            <div className="space-y-3">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Short links, arranged like a magazine spread.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Create, copy, and inspect every shortened URL from a single
                polished workspace.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="metric-card">
              <div className="metric-label">Links</div>
              <div className="metric-value">{urls.length}</div>
              <div className="metric-note">
                {urls.length === 1 ? 'One live URL' : 'Active short URLs'}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total clicks</div>
              <div className="metric-value">{totalClicks}</div>
              <div className="metric-note">Tracked across the dashboard</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Top link</div>
              <div className="metric-value">
                {mostClicked ? mostClicked.clickCount : 0}
              </div>
              <div className="metric-note truncate font-mono text-xs">
                {mostClicked ? mostClicked.shortCode : 'No clicks yet'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="surface rounded-[1.5rem] p-2 sm:p-3">
        <div className="overflow-hidden rounded-[1.15rem]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short code</TableHead>
                <TableHead>Original URL</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {urls.map((url) => (
                <TableRow key={url.shortCode}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {url.shortCode}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          copyShortUrl(url.shortUrl, url.shortCode)
                        }
                      >
                        {copiedCode === url.shortCode ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block cursor-default truncate text-muted-foreground">
                          {truncate(url.originalUrl, 44)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{url.originalUrl}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{url.clickCount}</Badge>
                  </TableCell>
                  <TableCell>{formatCreatedDate(url.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/analytics/${url.shortCode}`}>Analytics</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
