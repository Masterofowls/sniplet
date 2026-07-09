#!/usr/bin/env bash
# Scaffold a new app from template/tauri-react-mobile
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 \"App Name\" com.example.app ../output-dir" >&2
  exit 1
fi

NAME="$1"
APP_ID="$2"
OUTPUT="$3"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE="$ROOT/template/tauri-react-mobile"

if [[ ! -d "$TEMPLATE" ]]; then
  echo "Template not found: $TEMPLATE" >&2
  exit 1
fi

if [[ ! "$APP_ID" =~ ^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$ ]]; then
  echo "AppId must look like com.example.myapp" >&2
  exit 1
fi

SLUG="$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')"
[[ -z "$SLUG" ]] && SLUG="my-app"
CRATE="${SLUG//-/_}"
LIB_NAME="${CRATE}_lib"

if [[ -e "$OUTPUT" ]]; then
  echo "Output already exists: $OUTPUT" >&2
  exit 1
fi

echo "Creating app '$NAME' -> $OUTPUT"
cp -R "$TEMPLATE" "$OUTPUT"

replace_in_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  sed -i.bak \
    -e "s/{{APP_NAME}}/$NAME/g" \
    -e "s/{{APP_SLUG}}/$SLUG/g" \
    -e "s/{{APP_ID}}/$APP_ID/g" \
    -e "s/{{CRATE_NAME}}/$CRATE/g" \
    -e "s/{{LIB_NAME}}/$LIB_NAME/g" \
    "$file"
  rm -f "${file}.bak"
}

while IFS= read -r -d '' file; do
  replace_in_file "$file"
done < <(find "$OUTPUT" -type f \( \
  -name '*.ts' -o -name '*.tsx' -o -name '*.json' -o -name '*.md' -o -name '*.rs' -o \
  -name '*.toml' -o -name '*.html' -o -name '*.css' -o -name '*.sh' -o -name '*.ps1' -o \
  -name '*.kts' -o -name '*.properties' -o -name '.gitignore' -o -name '.env.example' \
\) -print0)

echo ""
echo "Done. Next steps:"
echo "  cd $OUTPUT"
echo "  npm install"
echo "  npm run android:init"
echo "  npm run android:patch"
echo "  npm run verify"
