#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FORCE=false

TARGETS=(
  "$HOME/.claude/skills"
  "$HOME/.agents/skills"
)

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

link_skill() {
  local skill_dir="$1"
  local target_dir="$2"
  local skill_name
  skill_name=$(basename "$skill_dir")
  local target="$target_dir/$skill_name"

  if [ -L "$target" ]; then
    existing_source=$(readlink "$target")
    if [ "$existing_source" = "$skill_dir" ] || [ "$existing_source" = "${skill_dir%/}" ]; then
      return 1  # already linked
    fi

    if [ "$FORCE" = true ]; then
      rm "$target"
    else
      echo "    ⚠ $skill_name (symlink exists → $(readlink "$target")). Use --force to replace."
      return 1
    fi
  elif [ -d "$target" ]; then
    if [ "$FORCE" = true ]; then
      rm -rf "$target"
    else
      echo "    ⚠ $skill_name (directory exists). Use --force to replace."
      return 1
    fi
  fi

  ln -s "${skill_dir%/}" "$target"
  return 0
}

for target_dir in "${TARGETS[@]}"; do
  mkdir -p "$target_dir"
  linked=0
  skipped=0
  agent_name=$(basename "$(dirname "$target_dir")")

  echo "$target_dir/"

  for skill_dir in "$SCRIPT_DIR"/skills/*/; do
    skill_name=$(basename "$skill_dir")
    if link_skill "$skill_dir" "$target_dir"; then
      echo "  + $skill_name"
      linked=$((linked + 1))
    else
      skipped=$((skipped + 1))
    fi
  done

  echo "  $linked linked, $skipped skipped"
  echo ""
done

echo "Claude Code plugins (install manually):"
echo "  claude plugins install frontend-design@claude-plugins-official"
echo "  claude plugins install commit-commands@claude-plugins-official"
echo "  claude plugins install typescript-lsp@claude-plugins-official"
echo ""
echo "Config files are in $SCRIPT_DIR/config/ — copy or symlink as needed:"
echo "  cp $SCRIPT_DIR/config/statusline.sh ~/.claude/statusline.sh"
echo "  cp $SCRIPT_DIR/config/settings.example.json ~/.claude/settings.json"
