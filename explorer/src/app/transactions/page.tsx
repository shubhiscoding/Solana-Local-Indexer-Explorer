"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { TransactionListResponse } from "@/lib/types";
import { Suspense } from "react";

function TransactionsList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback((isRefresh = false) => {
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
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPage = (p: number) => {
    router.push(`/transactions?page=${p}`);
  };

  if (loading)
    return <div className="text-center py-20 text-slate-500">Loading...</div>;
  if (!data)
    return <div className="text-center py-20 text-red-400">Failed to load</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">
          All Transactions
        </h1>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded transition-colors"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">Signature</th>
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Fee (lamports)</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data.transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-700/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/transactions/${tx.signature}`}
                    className="text-emerald-400 hover:underline font-mono text-xs"
                  >
                    {tx.signature.slice(0, 20)}...
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">{tx.slot}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      tx.success
                        ? "bg-emerald-900/50 text-emerald-400"
                        : "bg-red-900/50 text-red-400"
                    }`}
                  >
                    {tx.success ? "Success" : "Failed"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">{tx.fee ?? "-"}</td>
                <td className="px-4 py-3 text-slate-400">
                  {tx.blockTime
                    ? new Date(tx.blockTime).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-slate-400">
          Page {data.pagination.page} of {data.pagination.totalPages} (
          {data.pagination.total} total)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-slate-600 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= data.pagination.totalPages}
            className="px-3 py-1.5 text-sm border border-slate-600 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 text-slate-500">Loading...</div>
      }
    >
      <TransactionsList />
    </Suspense>
  );
}
