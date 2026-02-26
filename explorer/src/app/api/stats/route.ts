import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/serialization";

export const dynamic = "force-dynamic";

export async function GET() {
  const [totalTransactions, totalFailed, latestTx, recentTransactions] =
    await Promise.all([
      prisma.transaction.count(),
      prisma.failedTransaction.count(),
      prisma.transaction.findFirst({
        orderBy: { slot: "desc" },
        select: { slot: true },
      }),
      prisma.transaction.findMany({
        orderBy: { slot: "desc" },
        take: 10,
        select: {
          id: true,
          signature: true,
          slot: true,
          blockTime: true,
          success: true,
          fee: true,
        },
      }),
    ]);

  const total = totalTransactions + totalFailed;
  const successRate = total > 0 ? (totalTransactions / total) * 100 : 0;

  return NextResponse.json(
    serializeBigInts({
      totalTransactions,
      totalFailed,
      successRate: Math.round(successRate * 10) / 10,
      latestSlot: latestTx?.slot ?? 0,
      recentTransactions,
    })
  );
}
