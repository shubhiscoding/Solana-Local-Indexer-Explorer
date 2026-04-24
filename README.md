# Solana Local Explorer

A self-hosted Solana blockchain explorer with a test validator, gRPC indexer, PostgreSQL database, and Next.js web UI.

## Quick Start

```bash
docker compose up --build -d
```

That's it. All four services start automatically with proper dependency ordering:

1. **Validator** + **PostgreSQL** start first
2. **Indexer** starts after both are healthy
3. **Explorer** starts after the indexer is running

Open **http://localhost:3000** to view the explorer.

## Services

| Service | Container | Ports | Description |
|---------|-----------|-------|-------------|
| Validator | `solana-validator` | `8899` (RPC), `10000` (gRPC) | Solana test-validator with Yellowstone gRPC Geyser plugin |
| PostgreSQL | `explorer-postgres` | `5433` (host) → `5432` | Stores transactions, accounts, account–tx links, and per-tx account balances |
| Indexer | `solana-indexer` | — | Streams transactions via gRPC and writes to PostgreSQL |
| Explorer | `solana-explorer` | `3000` | Next.js web UI — dashboard, transaction list, transaction detail, account detail |

## Explorer UI

- **Dashboard** (`/`) — stat cards (total txs, failed, success rate, latest slot) + recent transactions table. Auto-refreshes every 5s.
- **Transaction List** (`/transactions`) — paginated table of all transactions with a refresh button.
- **Transaction Detail** (`/transactions/[signature]`) — full detail: accounts (clickable links to the account page), instructions, fees, memos, error logs.
- **Account Detail** (`/accounts/[address]`) — address, first/last seen, latest balance (from indexed metadata), and a paginated **balance history** table (pre/post balance and change per transaction). Data appears for accounts that appear in transactions indexed after balance tracking was enabled.

## Account indexing & balances

The indexer reads `preBalances` and `postBalances` from each successful transaction’s metadata (same fields Solana RPC exposes on `getTransaction`) and stores one row per account key index in the `AccountBalance` table, linked to the transaction. The `Account` table is still updated for every involved address so you can open an account page once that address has been seen.

**Note:** Only transactions indexed while this feature is deployed will have `AccountBalance` rows. Older rows in `Transaction` without corresponding balance records will still show on the transaction detail page, but the account page may show “Account not found” until a newer transaction involving that address is indexed.

## API routes

| Method | Route | Description |
|--------|--------|-------------|
| `GET` | `/api/stats` | Dashboard stats and recent transactions |
| `GET` | `/api/transactions?page=&limit=` | Paginated transaction list |
| `GET` | `/api/transactions/[signature]` | Single transaction (or failed tx) by signature |
| `GET` | `/api/accounts/[address]?page=&limit=` | Account metadata, latest balance (from indexed history), paginated balance rows with linked transaction signatures |

Query parameters `page` and `limit` follow the same conventions as the transaction list (defaults: page 1, limit 20; max limit 100 for accounts).

## Common Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f              # all services
docker compose logs -f indexer      # specific service

# Rebuild after code changes
docker compose up --build -d

# Regenerate Prisma client for local explorer dev
cd explorer && pnpm db:generate

# Stop everything
docker compose down

# Send a test transaction (from inside the validator container)
docker exec solana-validator solana-keygen new -o /root/.config/solana/id.json --no-bip39-passphrase --force
docker exec solana-validator solana airdrop 5 --url http://127.0.0.1:8899
docker exec solana-validator solana transfer --allow-unfunded-recipient 11111111111111111111111111111112 0.01 --url http://127.0.0.1:8899
```

## Access from Host

- **Explorer UI**: http://localhost:3000
- **Solana RPC**: http://localhost:8899
- **gRPC**: localhost:10000
- **Database**: `postgresql://postgres:password@localhost:5433/explorer`

## Using an Existing Ledger

To use your existing `test-ledger` directory instead of a fresh ledger, update `docker-compose.yml`:

```yaml
volumes:
  # Comment out the named volume and use bind mount:
  # - validator-ledger:/ledger
  - ./test-ledger:/ledger
```

## Tech Stack

- **Validator**: Solana test-validator v1.18.26 + Yellowstone gRPC Geyser plugin v1.15.3
- **Indexer**: TypeScript, Yellowstone gRPC client, Prisma ORM
- **Database**: PostgreSQL 15
- **Explorer**: Next.js 16 (App Router), Tailwind CSS v4, Prisma 5

## Demo WIP!

[Screencast from 2026-03-09 00-42-20.webm](https://github.com/user-attachments/assets/4b105c01-2345-4df4-88ee-b20b1d4e6cff)
