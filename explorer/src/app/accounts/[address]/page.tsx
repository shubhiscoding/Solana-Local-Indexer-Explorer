"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { DetailCardSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { PaginationControls } from "@/components/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Clock, History, Link as LinkIcon, Wallet } from "lucide-react";

function AccountDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const address = params.address as string;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const field = searchParams.get("field") || "postBalance";
  const amount = searchParams.get("amount") || "";
  const minAmount = searchParams.get("minAmount") || "";
  const maxAmount = searchParams.get("maxAmount") || "";
  const unit = searchParams.get("unit") === "lamports" ? "lamports" : "sol";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (field) params.set("field", field);
    if (unit) params.set("unit", unit);
    if (amount.trim()) {
      params.set("amount", amount.trim());
    } else {
      if (minAmount.trim()) params.set("minAmount", minAmount.trim());
      if (maxAmount.trim()) params.set("maxAmount", maxAmount.trim());
    }

    fetch(`/api/accounts/${address}?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Account not found");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address, page, field, amount, minAmount, maxAmount, unit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading)
    return (
      <div className="space-y-6">
        <DetailCardSkeleton />
        <TableSkeleton />
      </div>
    );
    
  if (error)
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-12 text-center text-destructive animate-in-fade">
        <Wallet className="h-8 w-8 mx-auto mb-4 opacity-50" />
        <h3 className="font-semibold text-lg">{error}</h3>
        <p className="opacity-80 mt-2">Checking an account requires it to have been involved in a transaction during indexing.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>
    );

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
          Account Profile
        </h1>
      </div>

      <Card className="animate-in-slide-up shadow-sm bg-gradient-to-br from-card to-card/50 border-primary/10">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row justify-between gap-6 md:items-center">
            
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-4 w-4" />
                Address
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg md:text-xl font-bold tracking-tight break-all">
                  {data.account.address}
                </span>
                <CopyButton value={data.account.address} />
              </div>
            </div>

            <div className="md:text-right space-y-1 bg-primary/5 px-6 py-4 rounded-xl border border-primary/10">
              <span className="text-sm font-medium text-muted-foreground">Current Balance</span>
              <div className="text-2xl md:text-3xl font-heading font-bold text-primary">
                {(parseInt(data.latestBalance) / 1e9).toFixed(9)} <span className="text-lg text-primary/70">SOL</span>
              </div>
            </div>

          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border/50">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" /> Total Transactions
              </span>
              <p className="font-mono text-base">{data.totalTransactions.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> First Seen
              </span>
              <p className="text-sm">{new Date(data.account.firstSeen).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Last Seen
              </span>
              <p className="text-sm">{new Date(data.account.lastSeen).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4 space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-heading font-semibold tracking-tight">
            Balance History
          </h2>
        </div>
        <form className="rounded-md border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-5">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Field</span>
              <select
                name="field"
                defaultValue={field}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="postBalance">Post Balance</option>
                <option value="preBalance">Pre Balance</option>
                <option value="balanceChange">Balance Change</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Unit</span>
              <select
                name="unit"
                defaultValue={unit}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="sol">SOL</option>
                <option value="lamports">Lamports</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Exact Amount</span>
              <Input
                name="amount"
                type="number"
                step="any"
                defaultValue={amount}
                placeholder="e.g. 1.5"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Min Amount</span>
              <Input
                name="minAmount"
                type="number"
                step="any"
                defaultValue={minAmount}
                placeholder="e.g. 0.1"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Max Amount</span>
              <Input
                name="maxAmount"
                type="number"
                step="any"
                defaultValue={maxAmount}
                placeholder="e.g. 10"
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit">Apply Filter</Button>
            <Button variant="outline" asChild>
              <Link href={`/accounts/${address}`}>Clear</Link>
            </Button>
          </div>
        </form>

        <div className="rounded-md border animate-in-slide-up bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/40">
                <TableHead>Transaction</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead className="text-right">Pre Balance (SOL)</TableHead>
                <TableHead className="text-right">Post Balance (SOL)</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.balances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No balance history found.
                  </TableCell>
                </TableRow>
              ) : (
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                data.balances.map((bal: any) => {
                  const change = parseInt(bal.balanceChange);
                  const isPositive = change > 0;
                  const isNegative = change < 0;
                  
                  return (
                    <TableRow key={bal.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono">
                        <Link
                          href={`/transactions/${bal.transaction.signature}`}
                          className="text-primary hover:underline hover:text-primary/80 transition-colors"
                        >
                          {bal.transaction.signature.slice(0, 16)}...
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {parseInt(bal.slot).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {(parseInt(bal.preBalance) / 1e9).toFixed(9)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-foreground">
                        {(parseInt(bal.postBalance) / 1e9).toFixed(9)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-mono text-xs px-2 py-1 rounded-md ${
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-500"
                              : isNegative
                              ? "bg-red-500/10 text-red-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {(change / 1e9).toFixed(9)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                        {bal.blockTime ? new Date(bal.blockTime).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationControls
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          basePath={`/accounts/${address}`}
        />
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="space-y-6"><DetailCardSkeleton /><TableSkeleton /></div>}>
      <AccountDetail />
    </Suspense>
  );
}
