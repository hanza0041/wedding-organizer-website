# Cross-platform recipes: Node handles subprocesses and .env on Windows/macOS/Linux.
.PHONY: help run server dev test browser-check backup docker-check docker-up docker-down docker-logs docker-backup docker-import docker-tunnel share up cloudflare quick tunnel named tunnel-login tunnel-create tunnel-dns tunnel-config

help:
	@node scripts/run.mjs help

run: server
server:
	node scripts/run.mjs server

dev:
	node --watch server.mjs

test:
	node --test test/*.test.mjs

browser-check:
	node scripts/browser-check.mjs

backup:
	node scripts/backup.mjs

docker-up:
	docker compose up -d --build app

docker-down:
	docker compose --profile tunnel down

docker-logs:
	docker compose logs -f app

docker-check:
	node scripts/docker-check.mjs

docker-backup:
	docker compose exec --user root app node scripts/backup.mjs

# Stop the native server first. The destination volume must not contain a database.
docker-import:
	docker compose run --rm --no-deps import-local

docker-tunnel:
	docker compose --profile tunnel up -d --build app cloudflared

# Starts server + Quick Tunnel; temporary random URL, no Cloudflare account needed.
share: quick
up: quick
cloudflare: quick
quick:
	node scripts/run.mjs quick

# Starts server + fixed-hostname Tunnel (token in .env, or local config).
tunnel: named
named:
	node scripts/run.mjs named

# Optional locally-managed tunnel setup. Read README.md before running.
tunnel-login:
	cloudflared tunnel login

tunnel-create:
	node scripts/run.mjs create

tunnel-dns:
	node scripts/run.mjs dns

tunnel-config:
	node scripts/run.mjs configure
