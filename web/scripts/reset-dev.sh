#!/bin/bash

# Reset Next.js Development Environment
# Run this script if you encounter build manifest or cache issues

echo "🔄 Resetting Next.js development environment..."

# Stop any running dev servers
echo "⏹️  Stopping any running processes..."
pkill -f "next dev" || true

# Clean all caches and build artifacts
echo "🧹 Cleaning caches and build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

# Clear any temporary files
echo "🗑️  Removing temporary files..."
find . -name "*.tmp.*" -delete 2>/dev/null || true

# Reinstall dependencies (optional, only if needed)
# echo "📦 Reinstalling dependencies..."
# rm -rf node_modules
# pnpm install

echo "✅ Reset complete! You can now run 'pnpm dev' safely."
