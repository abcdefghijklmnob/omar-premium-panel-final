#!/usr/bin/env bash
set -euo pipefail

EXPORT_DIR="omar-premium-panel-export"
ZIP_NAME="${EXPORT_DIR}.zip"

rm -rf "$EXPORT_DIR" "$ZIP_NAME"
mkdir -p "$EXPORT_DIR"

copy_file() {
  local src="$1"
  local dest="$EXPORT_DIR/$1"
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
}

copy_dir() {
  local src="$1"
  local dest="$EXPORT_DIR/$1"
  mkdir -p "$(dirname "$dest")"
  cp -R "$src" "$dest"
}

# Root files
for file in \
  AI_RULES.md \
  README.md \
  package.json \
  components.json \
  eslint.config.js \
  index.html \
  postcss.config.js \
  tailwind.config.ts \
  tsconfig.json \
  tsconfig.app.json \
  tsconfig.node.json \
  vercel.json \
  vite.config.ts \
  .env.example \
  EXPORT_OMAR_PREMIUM_PANEL.sh
  do
  if [ -f "$file" ]; then
    copy_file "$file"
  fi
done

# Application folders
for dir in src supabase public api docs
  do
  if [ -d "$dir" ]; then
    copy_dir "$dir"
  fi
done

# Optional lockfiles if present
for lockfile in package-lock.json pnpm-lock.yaml yarn.lock bun.lockb
  do
  if [ -f "$lockfile" ]; then
    copy_file "$lockfile"
  fi
done

# Create a zip if the zip utility is available.
if command -v zip >/dev/null 2>&1; then
  (
    cd "$EXPORT_DIR"
    zip -qr "../$ZIP_NAME" .
  )
  echo "Exported full project to: $EXPORT_DIR and $ZIP_NAME"
else
  echo "Exported full project to: $EXPORT_DIR"
  echo "zip utility not found, so only the folder export was created."
fi
