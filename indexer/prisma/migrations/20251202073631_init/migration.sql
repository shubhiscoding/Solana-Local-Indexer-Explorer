-- CreateTable
CREATE TABLE "Block" (
    "slot" BIGINT NOT NULL,
    "parentSlot" BIGINT,
    "blockhash" TEXT NOT NULL,
    "blockTime" BIGINT,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("slot")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "fee" BIGINT NOT NULL,
    "signers" TEXT[],
    "raw" JSONB,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("signature")
);

-- CreateTable
CREATE TABLE "Instruction" (
    "id" SERIAL NOT NULL,
    "signature" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "instructionIndex" INTEGER NOT NULL,
    "raw" JSONB NOT NULL,

    CONSTRAINT "Instruction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_slot_fkey" FOREIGN KEY ("slot") REFERENCES "Block"("slot") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instruction" ADD CONSTRAINT "Instruction_signature_fkey" FOREIGN KEY ("signature") REFERENCES "Transaction"("signature") ON DELETE RESTRICT ON UPDATE CASCADE;
