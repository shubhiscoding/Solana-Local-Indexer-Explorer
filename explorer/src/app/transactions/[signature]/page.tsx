"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

  if (loading)
    return <div className="text-center py-20 text-slate-500">Loading...</div>;
  if (error)
    return <div className="text-center py-20 text-red-400">{error}</div>;

  return (
    <div>
      <Link
        href="/transactions"
        className="text-emerald-400 hover:underline text-sm"
      >
        &larr; Back to transactions
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mt-2 mb-6">
        Transaction Detail
      </h1>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
        <DetailRow label="Signature" value={tx.signature} mono />
        <DetailRow label="Slot" value={tx.slot} mono />
        <DetailRow
          label="Time"
          value={
            tx.blockTime ? new Date(tx.blockTime).toLocaleString() : "N/A"
          }
        />
        <DetailRow label="Status">
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              tx.success !== false
                ? "bg-emerald-900/50 text-emerald-400"
                : "bg-red-900/50 text-red-400"
            }`}
          >
            {tx.success !== false ? "Success" : "Failed"}
          </span>
        </DetailRow>
        <DetailRow label="Fee (lamports)" value={tx.fee ?? "N/A"} mono />
        <DetailRow
          label="Compute Units"
          value={tx.computeUnitsUsed ?? "N/A"}
          mono
        />

        {tx.error && <DetailRow label="Error" value={tx.error} />}
        {tx.errorCode && (
          <DetailRow label="Error Code" value={tx.errorCode} mono />
        )}

        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">
            Accounts ({tx.accounts?.length ?? 0})
          </h3>
          <div className="space-y-1">
            {tx.accounts?.map((acct: string, i: number) => (
              <p
                key={i}
                className="font-mono text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded border border-slate-700"
              >
                {acct}
              </p>
            ))}
          </div>
        </div>

        {tx.instructions && (
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">
              Instructions ({tx.instructions?.length ?? 0})
            </h3>
            <pre className="text-xs text-emerald-300 bg-slate-950 border border-slate-700 p-4 rounded overflow-x-auto max-h-96 font-mono leading-5">
              {JSON.stringify(tx.instructions, null, 2)}
            </pre>
          </div>
        )}

        {tx.memos && tx.memos.length > 0 && (
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Memos</h3>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {tx.memos.map((memo: any) => (
              <p
                key={memo.id}
                className="text-sm text-yellow-300 bg-yellow-900/20 px-3 py-2 rounded border border-yellow-800/30"
              >
                {memo.content}
              </p>
            ))}
          </div>
        )}

        {tx.logs && tx.logs.length > 0 && (
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">
              Execution Logs
            </h3>
            <pre className="text-xs text-slate-300 bg-slate-950 border border-slate-700 p-4 rounded overflow-x-auto max-h-64 font-mono leading-5">
              {tx.logs.join("\n")}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string | number;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1">
      <span className="text-sm font-medium text-slate-400 sm:w-40 shrink-0">
        {label}
      </span>
      {children ?? (
        <span
          className={`text-sm text-slate-200 break-all ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}
