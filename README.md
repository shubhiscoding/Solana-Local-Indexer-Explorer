# Solana Local Explorer

A local Solana blockchain explorer with validator, indexer, and database services.

## Quick Start

### Using Docker Compose (Recommended)

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f validator
   docker-compose logs -f indexer
   ```

3. **Stop services:**
   ```bash
   docker-compose down
   ```

### Services

- **Validator** (`solana-validator`)
  - Solana RPC: `http://localhost:8899`
  - Yellowstone gRPC: `localhost:10000`
  - Ledger stored in Docker volume `validator-ledger`

- **PostgreSQL** (`explorer-postgres`)
  - Port: `5432`
  - Database: `explorer`
  - User: `postgres`
  - Password: `password`

- **Indexer** (`solana-indexer`)
  - Connects to validator gRPC and indexes blocks/transactions
  - Automatically runs database migrations on startup

### Using Existing Ledger

If you want to use your existing `test-ledger` directory instead of a fresh ledger, update `docker-compose.yml`:

```yaml
volumes:
  # Comment out the named volume and use bind mount:
  # - validator-ledger:/ledger
  - ./test-ledger:/ledger
```

### Verify gRPC Server

The validator should log that the Yellowstone gRPC server is running. Check logs:

```bash
docker-compose logs validator | grep -i "grpc\|yellowstone\|10000"
```

You should see the gRPC server listening on port 10000.

## Development

### Rebuild Services

```bash
docker-compose build
docker-compose up -d
```

### Access Services

- **Solana CLI** (from host): Use `http://localhost:8899` as RPC URL
- **Database** (from host): `postgresql://postgres:password@localhost:5432/explorer`
- **gRPC** (from host): `localhost:10000`

