"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { StatCardsSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import type { StatsResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity, ArrowRight, CheckCircle2, Layers, XCircle, Zap } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in-fade">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights into the Solana local test validator
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium w-fit">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          Live updating
        </div>
      </div>

      {loading ? (
        <StatCardsSkeleton />
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Transactions"
            value={stats.totalTransactions.toLocaleString()}
            icon={Zap}
          />
          <StatCard
            label="Failed Transactions"
            value={stats.totalFailed.toLocaleString()}
            icon={XCircle}
          />
          <StatCard
            label="Success Rate"
            value={`${stats.successRate}%`}
            icon={CheckCircle2}
            trend={{
              value: "Good",
              isPositive: stats.successRate > 80,
            }}
          />
          <StatCard
            label="Latest Slot"
            value={stats.latestSlot.toLocaleString()}
            icon={Layers}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          Failed to load stats data. Is the backend running?
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-heading font-semibold tracking-tight">
              Recent Transactions
            </h2>
          </div>
          <Button asChild variant="ghost" className="group">
            <Link href="/transactions">
              View all
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : stats ? (
          <div className="rounded-md border animate-in-slide-up bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px]">Signature</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Fee (SOL)</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentTransactions.map((tx) => (
                  <TableRow key={tx.id} className="group">
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/transactions/${tx.signature}`}
                              className="text-primary hover:underline"
                            >
                              {tx.signature.slice(0, 16)}...
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>{tx.signature}</TooltipContent>
                        </Tooltip>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <CopyButton value={tx.signature} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {parseInt(tx.slot).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge success={tx.success} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {tx.fee ? (parseInt(tx.fee) / 1e9).toFixed(9) : "0.000000000"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {tx.blockTime ? (
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">
                            {getRelativeTime(tx.blockTime)}
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(tx.blockTime).toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
