#!/bin/sh
set -e
echo "🐏 Aries v$(node -e "console.log(require('./package.json').version)" 2>/dev/null || echo '1.0.0')"
echo "📦 Running database migrations..."
node migrate.js
echo "🌐 Starting server on port ${PORT:-3000}..."
exec node server.js
