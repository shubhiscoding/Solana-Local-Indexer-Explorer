"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/loading-skeleton";
import { PaginationControls } from "@/components/pagination-controls";
import type { TransactionListResponse } from "@/lib/types";
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
import { RefreshCw, ListFilter } from "lucide-react";

function TransactionsList() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(
    (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      fetch(`/api/transactions?page=${page}&limit=20`)
        .then((res) => res.json())
        .then((d) => {
          setData(d);
          setLastUpdated(new Date());
        })
        .catch(console.error)
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [page]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            All Transactions
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse the complete history of ledger transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground mr-1 hidden sm:inline-block">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : !data ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-12 text-center text-destructive">
          <ListFilter className="h-8 w-8 mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold">Failed to load transactions</h3>
          <p className="text-sm mt-1 mb-4 opacity-80">
            There was an error communicating with the API.
          </p>
          <Button onClick={() => fetchData(true)} variant="outline">
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-md border animate-in-slide-up bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/40">
                  <TableHead className="w-[300px]">Signature</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Fee (SOL)</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.transactions.map((tx) => (
                    <TableRow key={tx.id} className="group">
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/transactions/${tx.signature}`}
                                className="text-primary hover:underline hover:text-primary/80 transition-colors"
                              >
                                {tx.signature.slice(0, 20)}...
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
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                        {tx.blockTime ? new Date(tx.blockTime).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            basePath="/transactions"
          />
        </>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TransactionsList />
    </Suspense>
  );
}
