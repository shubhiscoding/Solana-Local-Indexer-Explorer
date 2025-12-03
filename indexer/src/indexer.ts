import { prisma } from "./db/client";
import Client, {
  CommitmentLevel,
  SubscribeRequest,
} from "@triton-one/yellowstone-grpc";

const YELLOWSTONE_ADDR = process.env.YELLOWSTONE_ADDR || "localhost:10000";
const YELLOWSTONE_XTOKEN = process.env.YELLOWSTONE_XTOKEN || null;

export const startIndexer = async () => {
  // The Client expects a full URL (it parses it to extract hostname and port)
  // Convert host:port to http://host:port format
  let endpoint = YELLOWSTONE_ADDR;
  if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
    endpoint = `http://${endpoint}`;
  }
  
  console.log("📡 Connecting to Yellowstone gRPC:", endpoint);

  const client = new Client(
    endpoint,
    YELLOWSTONE_XTOKEN || undefined,
    {
      "grpc.max_receive_message_length": 64 * 1024 * 1024, // 64MB
    }
  );

  try {
    const stream = await client.subscribe();

    // Create subscribe request for slots and all transactions
    const request: SubscribeRequest = {
      accounts: {},
      slots: {
        client: {
          filterByCommitment: false,
        },
      },
      transactions: {
        client: {
          accountInclude: [],
          accountExclude: [],
          accountRequired: [],
        },
      },
      transactionsStatus: {},
      entry: {},
      blocks: {},
      blocksMeta: {},
      commitment: CommitmentLevel.PROCESSED,
      accountsDataSlice: [],
      ping: undefined,
    };

    // Send subscribe request
    await new Promise<void>((resolve, reject) => {
      stream.write(request, (err) => {
        if (err === null || err === undefined) {
          resolve();
        } else {
          reject(err);
        }
      });
    });

    console.log("✅ Subscribed to slots and transactions");

    stream.on("data", async (data: any) => {
      // Handle slot updates
      if (data.slot) {
        const s = data.slot.slot;
        const p = data.slot.parent;

        await prisma.block.upsert({
          where: { slot: BigInt(s) },
          update: {},
          create: {
            slot: BigInt(s),
            parentSlot: p ? BigInt(p) : null,
            blockhash: `local-${s}`, // test-validator doesn't give blockhash
            blockTime: BigInt(Date.now()),
          },
        });

        console.log(`🧱 Indexed slot ${s}`);
      }

      // Handle transaction updates
      if (data.transaction) {
        const txUpdate = data.transaction;
        const slot = txUpdate.slot;
        const transaction = txUpdate.transaction;
        
        if (!transaction) return;

        // Extract signature from transaction
        const signature = transaction.signature || 
          (transaction.transaction?.signatures?.[0]) ||
          "unknown";

        await prisma.transaction.upsert({
          where: { signature },
          update: {},
          create: {
            signature,
            slot: BigInt(slot),
            success: transaction.meta?.err === null || transaction.meta?.err === undefined,
            fee: BigInt(transaction.meta?.fee || 0),
            signers: transaction.transaction?.message?.accountKeys?.slice(
              0,
              transaction.transaction.message.header.numRequiredSignatures
            ) || [],
            raw: transaction as any,
          },
        });

        console.log(`💸 Indexed transaction ${signature}`);
      }
    });

    stream.on("error", (err) => {
      console.log("❌ gRPC Stream Error:", err);
    });

    stream.on("end", () => {
      console.log("⚠️ gRPC stream ended.");
    });

    stream.on("close", () => {
      console.log("🔌 gRPC stream closed.");
    });
  } catch (error) {
    console.error("❌ Failed to subscribe:", error);
    throw error;
  }
};
