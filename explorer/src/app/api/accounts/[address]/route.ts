import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/serialization";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  const account = await prisma.account.findUnique({
    where: { address },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const [balances, totalBalances, latest, stats] = await Promise.all([
    (prisma.accountBalance as any).findMany({
      where: { accountAddress: address },
      orderBy: { slot: "desc" },
      skip,
      take: limit,
      include: {
        transaction: {
          select: {
            signature: true,
            success: true,
            fee: true,
          },
        },
      },
    }),
    (prisma.accountBalance as any).count({
      where: { accountAddress: address },
    }),
    (prisma.accountBalance as any).findFirst({
      where: { accountAddress: address },
      orderBy: { slot: "desc" },
      select: { postBalance: true },
    }),
    (prisma.accountBalance as any).aggregate({
      where: { accountAddress: address },
      _sum: {
        balanceChange: true,
      },
      _count: true,
    }),
  ]);

  const latestBalance = latest?.postBalance ?? BigInt(0);

  return NextResponse.json(
    serializeBigInts({
      account,
      latestBalance,
      totalTransactions: totalBalances,
      totalBalanceChange: stats._sum.balanceChange || BigInt(0),
      balances,
      pagination: {
        page,
        limit,
        total: totalBalances,
        totalPages: Math.ceil(totalBalances / limit),
      },
    })
  );
}
