"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function AccountDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = params.address as string;
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/accounts/${address}?page=${page}&limit=20`)
      .then((res) => {
        if (!res.ok) throw new Error("Account not found");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPage = (p: number) => {
    router.push(`/accounts/${address}?page=${p}`);
  };

  if (loading)
    return <div className="text-center py-20 text-slate-500">Loading...</div>;
  if (error)
    return <div className="text-center py-20 text-red-400">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Account Details</h1>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6 space-y-4">
        <DetailRow label="Address" value={data.account.address} mono />
        <DetailRow
          label="Current Balance"
          value={`${(parseInt(data.latestBalance) / 1e9).toFixed(9)} SOL`}
        />
        <DetailRow label="Total Transactions" value={data.totalTransactions} />
        <DetailRow
          label="First Seen"
          value={new Date(data.account.firstSeen).toLocaleString()}
        />
        <DetailRow
          label="Last Seen"
          value={new Date(data.account.lastSeen).toLocaleString()}
        />
      </div>

      <h2 className="text-xl font-bold text-slate-100 mb-4">Balance History</h2>
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Pre Balance</th>
              <th className="px-4 py-3">Post Balance</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data.balances.map((bal: any) => {
              const change = parseInt(bal.balanceChange);
              const isPositive = change > 0;
              return (
                <tr key={bal.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/transactions/${bal.transaction.signature}`}
                      className="text-emerald-400 hover:underline font-mono text-xs"
                    >
                      {bal.transaction.signature.slice(0, 16)}...
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">{bal.slot}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {(parseInt(bal.preBalance) / 1e9).toFixed(9)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {(parseInt(bal.postBalance) / 1e9).toFixed(9)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono ${
                        isPositive
                          ? "text-emerald-400"
                          : change < 0
                          ? "text-red-400"
                          : "text-slate-500"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {(change / 1e9).toFixed(9)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {bal.blockTime
                      ? new Date(bal.blockTime).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              );
            })}
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

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | number;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1">
      <span className="text-sm font-medium text-slate-400 sm:w-40 shrink-0">
        {label}
      </span>
      <span
        className={`text-sm text-slate-200 break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 text-slate-500">Loading...</div>
      }
    >
      <AccountDetail />
    </Suspense>
  );
}
