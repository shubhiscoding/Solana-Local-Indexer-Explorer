"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface Bucket {
  ts: number;
  label: string;
  success: number;
  failed: number;
  total: number;
}

function bucketTransactions(
  txs: TransactionSummary[],
  range: RangeKey
): Bucket[] {
  const withTime = txs
    .map((tx) => ({
      success: tx.success,
      time: tx.blockTime ? new Date(tx.blockTime).getTime() : null,
    }))
    .filter((tx): tx is { success: boolean; time: number } => tx.time !== null);

  if (withTime.length === 0) return [];

  const now = Date.now();
  const minTime = Math.min(...withTime.map((t) => t.time));
  const maxTime = Math.max(...withTime.map((t) => t.time));

  const rangeDef = RANGES.find((r) => r.key === range)!;
  const windowMs = rangeDef.windowMs ?? Math.max(maxTime - minTime, 60_000);
  const startTime = rangeDef.windowMs ? now - rangeDef.windowMs : minTime;
  const endTime = rangeDef.windowMs ? now : maxTime;

  const bucketCount = 24;
  const bucketSize = Math.max(1000, Math.ceil(windowMs / bucketCount));
  const firstBucketStart = Math.floor(startTime / bucketSize) * bucketSize;

  const buckets = new Map<number, Bucket>();
  for (let t = firstBucketStart; t <= endTime; t += bucketSize) {
    buckets.set(t, {
      ts: t,
      label: formatBucketLabel(t, bucketSize),
      success: 0,
      failed: 0,
      total: 0,
    });
  }

  for (const tx of withTime) {
    if (tx.time < firstBucketStart || tx.time > endTime) continue;
    const key = Math.floor(tx.time / bucketSize) * bucketSize;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (tx.success) bucket.success += 1;
    else bucket.failed += 1;
    bucket.total += 1;
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

const CHART_W = 800;
const CHART_H = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

export function TransactionChart() {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("15m");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

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

  const maxY = useMemo(() => {
    const m = data.reduce((acc, b) => Math.max(acc, b.total), 0);
    return Math.max(1, m);
  }, [data]);

  const yTicks = useMemo(() => {
    const tickCount = 4;
    const step = Math.max(1, Math.ceil(maxY / tickCount));
    const ticks: number[] = [];
    for (let v = 0; v <= maxY; v += step) ticks.push(v);
    if (ticks[ticks.length - 1] !== maxY) ticks.push(maxY);
    return ticks;
  }, [maxY]);

  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;
  const barGap = 4;
  const barW = data.length > 0 ? Math.max(2, innerW / data.length - barGap) : 0;

  const xForIndex = (i: number) =>
    PAD.left + i * (innerW / Math.max(1, data.length)) + barGap / 2;
  const yForValue = (v: number) => PAD.top + innerH - (v / maxY) * innerH;
  const heightForValue = (v: number) => (v / maxY) * innerH;

  const xLabels = useMemo(() => {
    if (data.length === 0) return [] as { x: number; label: string }[];
    const want = 5;
    const step = Math.max(1, Math.floor(data.length / (want - 1)));
    const out: { x: number; label: string }[] = [];
    for (let i = 0; i < data.length; i += step) {
      out.push({ x: xForIndex(i) + barW / 2, label: data[i].label });
    }
    const last = data.length - 1;
    if (out[out.length - 1]?.label !== data[last].label) {
      out.push({ x: xForIndex(last) + barW / 2, label: data[last].label });
    }
    return out;
  }, [data, barW]);

  const hasAnyData = data.some((d) => d.total > 0);
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const xInSvg = xRatio * CHART_W;
    if (xInSvg < PAD.left || xInSvg > CHART_W - PAD.right) {
      setHoverIndex(null);
      return;
    }
    const idx = Math.floor(((xInSvg - PAD.left) / innerW) * data.length);
    setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const tooltipX = hoverIndex !== null ? xForIndex(hoverIndex) + barW / 2 : 0;
  const tooltipLeftPct = (tooltipX / CHART_W) * 100;
  const tooltipOnRightHalf = tooltipLeftPct > 60;

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
        <div className="flex flex-wrap items-center gap-4">
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
            <div className="text-xs">
              Send a tx to your local validator to see it here
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              preserveAspectRatio="none"
              className="block h-[260px] w-full"
              onMouseMove={handleMove}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="grad-success" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="grad-failed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0.55} />
                </linearGradient>
              </defs>

              {/* Y grid + labels */}
              {yTicks.map((t) => {
                const y = yForValue(t);
                return (
                  <g key={`y-${t}`}>
                    <line
                      x1={PAD.left}
                      x2={CHART_W - PAD.right}
                      y1={y}
                      y2={y}
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                      strokeOpacity={0.7}
                    />
                    <text
                      x={PAD.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize={10}
                      fill="var(--muted-foreground)"
                    >
                      {t}
                    </text>
                  </g>
                );
              })}

              {/* Hover guide */}
              {hoverIndex !== null && (
                <line
                  x1={tooltipX}
                  x2={tooltipX}
                  y1={PAD.top}
                  y2={CHART_H - PAD.bottom}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
              )}

              {/* Bars */}
              {data.map((b, i) => {
                const x = xForIndex(i);
                const failH = heightForValue(b.failed);
                const succH = heightForValue(b.success);
                const failY = PAD.top + innerH - failH;
                const succY = failY - succH;
                const isHover = hoverIndex === i;
                return (
                  <g key={`bar-${b.ts}`} opacity={hoverIndex === null || isHover ? 1 : 0.55}>
                    {b.failed > 0 && (
                      <rect
                        x={x}
                        y={failY}
                        width={barW}
                        height={failH}
                        rx={2}
                        fill="url(#grad-failed)"
                      />
                    )}
                    {b.success > 0 && (
                      <rect
                        x={x}
                        y={succY}
                        width={barW}
                        height={succH}
                        rx={2}
                        fill="url(#grad-success)"
                      />
                    )}
                  </g>
                );
              })}

              {/* X axis labels */}
              {xLabels.map((tick, i) => (
                <text
                  key={`x-${i}`}
                  x={tick.x}
                  y={CHART_H - PAD.bottom + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--muted-foreground)"
                >
                  {tick.label}
                </text>
              ))}

              {/* Baseline */}
              <line
                x1={PAD.left}
                x2={CHART_W - PAD.right}
                y1={CHART_H - PAD.bottom}
                y2={CHART_H - PAD.bottom}
                stroke="var(--border)"
              />
            </svg>

            {/* HTML tooltip */}
            {hovered && hoverIndex !== null && (
              <div
                className={cn(
                  "pointer-events-none absolute top-2 z-10 rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm",
                  tooltipOnRightHalf ? "-translate-x-full" : ""
                )}
                style={{ left: `calc(${tooltipLeftPct}% ${tooltipOnRightHalf ? "- 8px" : "+ 8px"})` }}
              >
                <div className="mb-1 font-medium text-foreground">
                  at {hovered.label}
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Successful</span>
                  <span className="ml-auto font-mono tabular-nums text-foreground">
                    {hovered.success}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Failed</span>
                  <span className="ml-auto font-mono tabular-nums text-foreground">
                    {hovered.failed}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
