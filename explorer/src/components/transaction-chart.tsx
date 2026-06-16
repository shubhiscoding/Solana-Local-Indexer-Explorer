"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TransactionListResponse, TransactionSummary } from "@/lib/types";

type RangeKey = "5m" | "15m" | "1h" | "all";

const RANGES: { key: RangeKey; label: string; windowMs: number | null }[] = [
  { key: "5m", label: "5m", windowMs: 5 * 60 * 1000 },
  { key: "15m", label: "15m", windowMs: 15 * 60 * 1000 },
  { key: "1h", label: "1h", windowMs: 60 * 60 * 1000 },
  { key: "all", label: "All", windowMs: null },
];

const chartConfig = {
  success: {
    label: "Successful",
    color: "var(--primary)",
  },
  failed: {
    label: "Failed",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

interface Bucket {
  ts: number;
  label: string;
  success: number;
  failed: number;
}

function bucketTransactions(
  txs: TransactionSummary[],
  range: RangeKey
): Bucket[] {
  const withTime = txs
    .map((tx) => ({
      ...tx,
      time: tx.blockTime ? new Date(tx.blockTime).getTime() : null,
    }))
    .filter((tx): tx is TransactionSummary & { time: number } => tx.time !== null);

  if (withTime.length === 0) return [];

  const now = Date.now();
  const minTime = Math.min(...withTime.map((t) => t.time));
  const maxTime = Math.max(...withTime.map((t) => t.time));

  const rangeDef = RANGES.find((r) => r.key === range)!;
  const windowMs = rangeDef.windowMs ?? Math.max(maxTime - minTime, 60_000);
  const startTime = rangeDef.windowMs ? now - rangeDef.windowMs : minTime;

  const bucketCount = 24;
  const bucketSize = Math.max(1000, Math.ceil(windowMs / bucketCount));
  const endTime = rangeDef.windowMs ? now : maxTime;
  const firstBucketStart = Math.floor(startTime / bucketSize) * bucketSize;

  const buckets = new Map<number, Bucket>();
  for (let t = firstBucketStart; t <= endTime; t += bucketSize) {
    buckets.set(t, {
      ts: t,
      label: formatBucketLabel(t, bucketSize),
      success: 0,
      failed: 0,
    });
  }

  for (const tx of withTime) {
    if (tx.time < firstBucketStart || tx.time > endTime) continue;
    const bucketKey = Math.floor(tx.time / bucketSize) * bucketSize;
    const bucket = buckets.get(bucketKey);
    if (!bucket) continue;
    if (tx.success) bucket.success += 1;
    else bucket.failed += 1;
  }

  return Array.from(buckets.values()).sort((a, b) => a.ts - b.ts);
}

function formatBucketLabel(ts: number, bucketSize: number) {
  const d = new Date(ts);
  if (bucketSize < 60_000) {
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function TransactionChart() {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("15m");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/transactions?limit=100&page=1");
        const data: TransactionListResponse = await res.json();
        if (!cancelled) setTransactions(data.transactions ?? []);
      } catch (err) {
        console.error("Failed to fetch transactions for chart:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const data = useMemo(
    () => bucketTransactions(transactions, range),
    [transactions, range]
  );

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, b) => ({
          success: acc.success + b.success,
          failed: acc.failed + b.failed,
        }),
        { success: 0, failed: 0 }
      ),
    [data]
  );

  const hasAnyData = data.some((d) => d.success > 0 || d.failed > 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Transaction Activity
          </CardTitle>
          <CardDescription>
            Successful vs failed transactions over time
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
              <span className="font-mono tabular-nums text-foreground">
                {totals.success.toLocaleString()}
              </span>
              <span>success</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" />
              <span className="font-mono tabular-nums text-foreground">
                {totals.failed.toLocaleString()}
              </span>
              <span>failed</span>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5">
            {RANGES.map((r) => (
              <Button
                key={r.key}
                size="sm"
                variant="ghost"
                onClick={() => setRange(r.key)}
                className={cn(
                  "h-7 px-2.5 text-xs font-medium",
                  range === r.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Loading chart…
          </div>
        ) : !hasAnyData ? (
          <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-6 w-6 opacity-60" />
            <div>No transactions in this window yet</div>
            <div className="text-xs">Send a tx to your local validator to see it here</div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="fill-success" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fill-failed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-failed)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-failed)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={32}
                allowDecimals={false}
                fontSize={11}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => `at ${value}`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="failed"
                stackId="tx"
                stroke="var(--color-failed)"
                strokeWidth={2}
                fill="url(#fill-failed)"
              />
              <Area
                type="monotone"
                dataKey="success"
                stackId="tx"
                stroke="var(--color-success)"
                strokeWidth={2}
                fill="url(#fill-success)"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
