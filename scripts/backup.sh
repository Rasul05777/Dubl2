#!/usr/bin/env bash
set -euo pipefail
umask 077
destination="${1:-backups/$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$destination"
docker compose exec -T db pg_dump -U dubl -Fc dubl > "$destination/database.dump"
docker compose exec -T backend tar czf - -C /app/uploads . > "$destination/uploads.tar.gz"
echo "Backup saved: $destination"
