import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/serialization";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signature: string }> }
) {
  const { signature } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { signature },
    include: { memos: true },
  });

  if (transaction) {
    return NextResponse.json(serializeBigInts(transaction));
  }

  const failedTx = await prisma.failedTransaction.findUnique({
    where: { signature },
  });

  if (failedTx) {
    return NextResponse.json(serializeBigInts({ ...failedTx, success: false }));
  }

  return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
}
