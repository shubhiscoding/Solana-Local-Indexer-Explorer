# Kubernetes deployment (kind)

Runs the validator, indexer, explorer and PostgreSQL in namespace `solana-explorer`.

## Prerequisites

- Docker, kind, kubectl
- Apple Silicon: the validator image is built for `linux/arm64` (see below)

## 1. Create the cluster

```sh
kind create cluster --name solana-dev
kubectl config use-context kind-solana-dev
```

## 2. Build images

```sh
docker build -t solana-local-indexer-explorer-indexer:latest indexer
docker build -t solana-local-indexer-explorer-explorer:latest explorer
docker build --platform linux/arm64 -f validator/Dockerfile.arm64 \
  -t solana-local-indexer-explorer-validator:arm64 validator
```

Load them into kind:

```sh
kind load docker-image solana-local-indexer-explorer-indexer:latest --name solana-dev
kind load docker-image solana-local-indexer-explorer-explorer:latest --name solana-dev
kind load docker-image solana-local-indexer-explorer-validator:arm64 --name solana-dev
```

`validator/Dockerfile.arm64` builds `solana-test-validator` from source. Expect several
minutes on a cold cache. Anza publishes no `linux/aarch64` Solana release for v1.18.26. On amd64
hosts, `validator/Dockerfile` can be used instead; the manifest would then need the
`:latest` tag.

## 3. Create the database secret

The password is not stored in git. Choose one and create the Secret before deploying:

```sh
kubectl create namespace solana-explorer
kubectl -n solana-explorer create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD='<choose-a-password>'
```

PostgreSQL reads this value only on first start, when its data volume is empty.

## 4. Deploy

Apply in dependency order:

```sh
kubectl apply -f k8s/namespace.yaml -f k8s/postgres.yaml
kubectl -n solana-explorer rollout status statefulset/postgres
kubectl apply -f k8s/validator.yaml
kubectl -n solana-explorer rollout status deploy/validator
kubectl apply -f k8s/indexer.yaml -f k8s/explorer.yaml
kubectl -n solana-explorer rollout status deploy/indexer
kubectl -n solana-explorer rollout status deploy/explorer
```

## 5. Access the explorer

```sh
kubectl -n solana-explorer port-forward svc/explorer 3000:3000
# open http://localhost:3000
```

## 6. Verify

```sh
k8s/verify.sh
```

Checks pod readiness, validator `/health`, explorer HTTP status, and that the indexer has
written rows to PostgreSQL.

## 7. Roll back

Revert to the previous ReplicaSet of a workload:

```sh
kubectl -n solana-explorer rollout undo deploy/indexer
kubectl -n solana-explorer rollout history deploy/indexer
```

Images are local kind tags here, so a rollback reuses the previous image on the node.
For GHCR images built by CI, tags are commit SHAs, so a specific commit can be pinned
by setting `image:` to `ghcr.io/<owner>/solana-explorer-<name>:<sha>`.

## Known limitations

- Single replica per workload. The indexer must not run twice, and the validator ledger
  is a single ReadWriteOnce volume.
- The indexer has no in-process reconnect. When its gRPC stream drops, the process exits
  and Kubernetes restarts it. Startup retries apply only to the database.
- The indexer has no HTTP health endpoint, so it has no readiness or liveness probe.
  Its liveness is process liveness only.
- No metrics or tracing endpoints. Evidence comes from logs, probes and `verify.sh`.
- The validator runs as root. It is not `runAsNonRoot`.
- Explorer is reached through `port-forward`. There is no ingress or NodePort.
- Local kind images are not signed or scanned.
