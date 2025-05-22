#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
/usr/local/bin/wait-for-it.sh db:5432 -t 30

# Run migrations if needed
echo "Running database migrations..."
bun run db:migrate

# Execute the original command
exec "$@"
