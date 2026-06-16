import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ApiError,
  getAllUrls,
  getAnalytics,
  type AnalyticsResponse,
  type ClicksPerDay,
} from "@/api/trim";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function fillClicksPerDay(clicksPerDay: ClicksPerDay[]) {
  const filled = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const date = d.toISOString().split("T")[0];
    const found = clicksPerDay.find((p) => p.date === date);
    return { date, clicks: found?.clicks ?? 0 };
  });

  return filled;
}

function formatChartDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatPercentage(clicks: number, total: number): string {
  if (total === 0) {
    return "0%";
  }

  return `${((clicks / total) * 100).toFixed(1)}%`;
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="surface rounded-[1.75rem] p-6 sm:p-8">
        <div className="space-y-4">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-12 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="metric-card">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-18" />
              <Skeleton className="mt-2 h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-80 w-full rounded-[1.5rem]" />
      <Skeleton className="h-56 w-full rounded-[1.5rem]" />
    </div>
  );
}

export default function AnalyticsPage() {
  const { code } = useParams<{ code: string }>();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      return;
    }

    const shortCode = code;
    let cancelled = false;

    async function loadAnalytics() {
      setIsLoading(true);
      setError(null);

      try {
        let data = await getAnalytics(shortCode);

        if (!data.originalUrl) {
          const urls = await getAllUrls();
          const match = urls.find((url) => url.shortCode === shortCode);
          if (match) {
            data = { ...data, originalUrl: match.originalUrl };
          }
        }

        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load analytics",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const filled = useMemo(
    () => fillClicksPerDay(analytics?.clicksPerDay ?? []),
    [analytics?.clicksPerDay],
  );
  const topReferrer = analytics?.byReferrer?.[0] ?? null;
  const referrerCount = analytics?.byReferrer.length ?? 0;

  if (!code) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Missing short code.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild className="w-fit">
        <Link to="/">
          <ArrowLeftIcon />
          Back to links
        </Link>
      </Button>

      <section className="surface rounded-[1.75rem] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="section-kicker">Analytics</span>
            <div className="space-y-3">
              <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {analytics.shortCode}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                A clear, date-by-date view of how this link is performing,
                including source breakdowns and the destination it points to.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[34rem]">
            <div className="metric-card">
              <div className="metric-label">Total clicks</div>
              <div className="metric-value">{analytics.totalClicks}</div>
              <div className="metric-note">All recorded visits</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Referrers</div>
              <div className="metric-value">{referrerCount}</div>
              <div className="metric-note">
                {topReferrer ? topReferrer.referrer : "No source data yet"}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Destination</div>
              <div className="metric-value">
                {analytics.originalUrl ? "Live" : "Hidden"}
              </div>
              <div className="metric-note truncate text-xs">
                {analytics.originalUrl ?? "Unavailable"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <Card className="surface border-border/70 bg-transparent shadow-none">
          <CardHeader className="gap-2 border-b border-border/70 pb-4">
            <CardTitle className="text-xl">Clicks per day</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last 30 days, with missing dates filled to keep the chart honest.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex h-[22rem] w-full items-center justify-center">
              {analytics.totalClicks === 0 ? (
                <div className="surface-soft flex h-full w-full items-center justify-center rounded-[1.25rem]">
                  <p className="text-sm text-muted-foreground">No clicks yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filled}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border/70"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDate}
                      tick={{ fontSize: 12, fill: "currentColor" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, "auto"]}
                      tick={{ fontSize: 12, fill: "currentColor" }}
                      width={32}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "0.85rem",
                        border: "1px solid var(--border)",
                        background: "var(--popover)",
                        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
                      }}
                      labelFormatter={(label) => formatChartDate(String(label))}
                      formatter={(value) => [value, "Clicks"]}
                    />
                    <Area
                      type="step"
                      dataKey="clicks"
                      fill="#0f766e"
                      fillOpacity={0.18}
                      stroke="#0f766e"
                      strokeWidth={2.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="surface border-border/70 bg-transparent shadow-none">
          <CardHeader className="gap-2 border-b border-border/70 pb-4">
            <CardTitle className="text-xl">Referrer breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Where the clicks came from and how much each source contributed.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-b-[1rem]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.byReferrer.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No referrer data yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    analytics.byReferrer.map((item) => (
                      <TableRow key={item.referrer}>
                        <TableCell className="max-w-md truncate">
                          {item.referrer}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.clicks}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(item.clicks, analytics.totalClicks)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
