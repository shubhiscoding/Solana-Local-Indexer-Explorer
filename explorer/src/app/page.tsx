"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StatsResponse } from "@/lib/types";

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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return <div className="text-center py-20 text-slate-500">Loading...</div>;
  if (!stats)
    return (
      <div className="text-center py-20 text-red-400">Failed to load data</div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Transactions"
          value={stats.totalTransactions.toLocaleString()}
        />
        <StatCard
          label="Failed Transactions"
          value={stats.totalFailed.toLocaleString()}
        />
        <StatCard label="Success Rate" value={`${stats.successRate}%`} />
        <StatCard label="Latest Slot" value={stats.latestSlot} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-200">
          Recent Transactions
        </h2>
        <Link
          href="/transactions"
          className="text-sm text-emerald-400 hover:underline"
        >
          View all
        </Link>
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
            {stats.recentTransactions.map((tx) => (
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
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
    </div>
  );
}
