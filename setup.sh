#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_SKILLS_DIR="$HOME/.claude/skills"
FORCE=false

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

mkdir -p "$CLAUDE_SKILLS_DIR"

linked=0
skipped=0

echo "Installing skills from $SCRIPT_DIR/skills/ → $CLAUDE_SKILLS_DIR/"
echo ""

for skill_dir in "$SCRIPT_DIR"/skills/*/; do
  skill_name=$(basename "$skill_dir")
  target="$CLAUDE_SKILLS_DIR/$skill_name"

  if [ -L "$target" ]; then
    existing_source=$(readlink "$target")
    if [ "$existing_source" = "$skill_dir" ] || [ "$existing_source" = "${skill_dir%/}" ]; then
      echo "  ✓ $skill_name (already linked)"
      skipped=$((skipped + 1))
      continue
    fi

    if [ "$FORCE" = true ]; then
      rm "$target"
      echo "  ↻ $skill_name (replaced existing symlink)"
    else
      echo "  ⚠ $skill_name (symlink exists → $(readlink "$target")). Use --force to replace."
      skipped=$((skipped + 1))
      continue
    fi
  elif [ -d "$target" ]; then
    if [ "$FORCE" = true ]; then
      rm -rf "$target"
      echo "  ↻ $skill_name (replaced existing directory)"
    else
      echo "  ⚠ $skill_name (directory exists). Use --force to replace."
      skipped=$((skipped + 1))
      continue
    fi
  fi

  ln -s "${skill_dir%/}" "$target"
  echo "  + $skill_name"
  linked=$((linked + 1))
done

echo ""
echo "Done. $linked skills linked, $skipped skipped."
echo ""
echo "Plugins to install manually (not included in this repo):"
echo "  claude plugins install frontend-design@claude-plugins-official"
echo "  claude plugins install commit-commands@claude-plugins-official"
echo "  claude plugins install typescript-lsp@claude-plugins-official"
echo ""
echo "Config files are in $SCRIPT_DIR/config/ — copy or symlink as needed:"
echo "  cp $SCRIPT_DIR/config/statusline.sh ~/.claude/statusline.sh"
echo "  cp $SCRIPT_DIR/config/settings.example.json ~/.claude/settings.json"
