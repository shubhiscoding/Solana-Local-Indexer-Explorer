"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/status-badge";
import { DetailCardSkeleton } from "@/components/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Braces, ChevronRight, FileText, Info, Layers, TerminalSquare } from "lucide-react";

export default function TransactionDetailPage() {
  const params = useParams();
  const signature = params.signature as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/transactions/${signature}`)
      .then((res) => {
        if (!res.ok) throw new Error("Transaction not found");
        return res.json();
      })
      .then(setTx)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [signature]);

  if (loading) return <DetailCardSkeleton />;
  if (error)
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-12 text-center text-destructive animate-in-fade">
        <Info className="h-8 w-8 mx-auto mb-4 opacity-50" />
        <h3 className="font-semibold text-lg">{error}</h3>
        <p className="opacity-80">Check the signature and try again.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/transactions">Back to Transactions</Link>
        </Button>
      </div>
    );

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex items-center text-sm text-muted-foreground gap-2 mb-4">
        <Link href="/transactions" className="hover:text-foreground transition-colors">
          Transactions
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate w-32 md:w-auto">{signature}</span>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href="/transactions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
          Transaction Detail
        </h1>
      </div>

      <Card className="animate-in-slide-up shadow-sm">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <DetailRow label="Signature" icon={FileText}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm break-all">{tx.signature}</span>
                <CopyButton value={tx.signature} />
              </div>
            </DetailRow>

            <DetailRow label="Status" icon={Info}>
              <StatusBadge success={tx.success !== false} />
            </DetailRow>

            <DetailRow label="Slot" icon={Layers}>
              <span className="font-mono">{tx.slot.toLocaleString()}</span>
            </DetailRow>

            <DetailRow label="Time" icon={Info}>
              <span>
                {tx.blockTime ? new Date(tx.blockTime).toLocaleString() : "N/A"}
              </span>
            </DetailRow>

            <DetailRow label="Fee" icon={ZapIcon}>
              <span className="font-mono">
                {tx.fee ? `${(parseInt(tx.fee) / 1e9).toFixed(9)} SOL` : "N/A"}
              </span>
            </DetailRow>

            <DetailRow label="Compute Units" icon={TerminalSquare}>
              <span className="font-mono">
                {tx.computeUnitsUsed ? parseInt(tx.computeUnitsUsed).toLocaleString() : "N/A"}
              </span>
            </DetailRow>

            {tx.error && (
              <DetailRow label="Error" icon={XCircleIcon} className="col-span-1 md:col-span-2 text-destructive">
                <span className="break-words font-mono text-xs p-2 bg-destructive/10 rounded overflow-auto max-w-full">
                  {tx.error}
                </span>
              </DetailRow>
            )}
            
            {tx.errorCode && (
              <DetailRow label="Error Code" icon={XCircleIcon}>
                <span className="font-mono">{tx.errorCode}</span>
              </DetailRow>
            )}
          </div>

          <Separator />

          <div className="p-6 bg-muted/20">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Accounts ({tx.accounts?.length ?? 0})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {tx.accounts?.map((acct: string, i: number) => (
                <div key={i} className="flex items-center justify-between bg-background border px-3 py-2 rounded-md hover:border-primary/50 transition-colors">
                  <Link
                    href={`/accounts/${acct}`}
                    className="font-mono text-xs text-primary hover:underline truncate mr-2"
                  >
                    {acct}
                  </Link>
                  <CopyButton value={acct} />
                </div>
              ))}
            </div>
          </div>

          {tx.instructions && (
            <>
              <Separator />
              <div className="p-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Braces className="h-4 w-4 text-primary" />
                  Instructions ({tx.instructions?.length ?? 0})
                </h3>
                <pre className="text-xs text-emerald-600 dark:text-emerald-400 bg-muted border p-4 rounded-md overflow-x-auto max-h-96 font-mono leading-relaxed">
                  {JSON.stringify(tx.instructions, null, 2)}
                </pre>
              </div>
            </>
          )}

          {tx.memos && tx.memos.length > 0 && (
            <>
              <Separator />
              <div className="p-6 bg-muted/20">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  Memos
                </h3>
                <div className="space-y-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {tx.memos.map((memo: any) => (
                    <div
                      key={memo.id}
                      className="text-sm text-foreground bg-amber-500/10 p-3 rounded-md border border-amber-500/20"
                    >
                      {memo.content}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tx.logs && tx.logs.length > 0 && (
            <>
              <Separator />
              <div className="p-6 rounded-b-lg">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TerminalSquare className="h-4 w-4 text-primary" />
                  Execution Logs
                </h3>
                <pre className="text-xs text-muted-foreground bg-black/90 p-4 rounded-md overflow-x-auto max-h-64 font-mono leading-relaxed">
                  {tx.logs.join("\n")}
                </pre>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  icon: Icon,
  children,
  className = "",
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <div className="text-sm">
        {children}
      </div>
    </div>
  );
}

// Stubs for inline icons to avoid extra imports above
const ZapIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </svg>
);
const XCircleIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);
