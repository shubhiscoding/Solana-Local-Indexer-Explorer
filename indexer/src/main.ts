import { execSync } from "child_process";
import { startIndexer } from "./indexer";

async function main() {
  console.log("🚀 Starting Solana Indexer...");
  
  // Run migrations on startup
  try {
    console.log("📦 Running database migrations...");
    execSync("pnpm prisma migrate deploy", { stdio: "inherit" });
    console.log("✅ Migrations completed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
  
  // Start the indexer
  try {
    await startIndexer();
  } catch (error) {
    console.error("❌ Indexer failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
