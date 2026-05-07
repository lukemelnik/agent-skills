#!/bin/bash

input=$(cat)

cwd=$(echo "$input" | jq -r '.workspace.current_dir')
project_dir=$(echo "$input" | jq -r '.workspace.project_dir')
model_name=$(echo "$input" | jq -r '.model.display_name')
model_id=$(echo "$input" | jq -r '.model.id')
output_style=$(echo "$input" | jq -r '.output_style.name // "default"')
remaining=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')

RESET="\033[0m"

# Kanagawa theme colors
BLUE="\033[38;2;126;156;216m"      # crystalBlue #7E9CD8
PURPLE="\033[38;2;149;127;184m"    # oniViolet #957FB8
GREEN="\033[38;2;152;187;108m"     # springGreen #98BB6C
YELLOW="\033[38;2;230;195;132m"    # carpYellow #E6C384
CYAN="\033[38;2;122;168;159m"      # waveAqua #7AA89F
RED="\033[38;2;195;64;67m"         # autumnRed #C34043
ORANGE="\033[38;2;255;160;102m"    # surimiOrange #FFA066
GRAY="\033[38;2;200;192;147m"      # oldWhite #C8C093

ICON_FOLDER="📁"
ICON_GIT=""
ICON_MODEL="🤖"
ICON_CONTEXT="📊"
ICON_STYLE="✨"
ICON_AHEAD="⬆"
ICON_BEHIND="⬇"

git_branch=""
git_status=""
git_ahead=""
git_behind=""
if [ -d "$cwd/.git" ] || git -C "$cwd" rev-parse --git-dir >/dev/null 2>&1; then
    git_branch=$(git -C "$cwd" branch --show-current 2>/dev/null || echo "")

    if [ -n "$git_branch" ]; then
        if ! git -C "$cwd" diff --quiet 2>/dev/null || ! git -C "$cwd" diff --cached --quiet 2>/dev/null; then
            git_status="*"
        fi

        upstream=$(git -C "$cwd" rev-parse --abbrev-ref "@{upstream}" 2>/dev/null)
        if [ -n "$upstream" ]; then
            git_ahead=$(git -C "$cwd" rev-list --count "@{upstream}..HEAD" 2>/dev/null || echo "0")
            git_behind=$(git -C "$cwd" rev-list --count "HEAD..@{upstream}" 2>/dev/null || echo "0")
        fi
    fi
fi

display_dir="${cwd/#$HOME/~}"

if [ "$project_dir" != "null" ] && [ "$project_dir" != "$cwd" ]; then
    rel_path="${cwd/#$project_dir\//}"
    if [ "$rel_path" != "$cwd" ]; then
        project_name=$(basename "$project_dir")
        display_dir="$project_name/$rel_path"
    fi
fi

model_short="$model_name"
if [[ "$model_id" == *"sonnet"* ]]; then
    model_short="Sonnet"
    [[ "$model_id" == *"3-5"* ]] && model_short="Sonnet 3.5"
    [[ "$model_id" == *"4"* ]] && model_short="Sonnet 4"
    [[ "$model_id" == *"4-5"* ]] && model_short="Sonnet 4.5"
elif [[ "$model_id" == *"opus"* ]]; then
    model_short="Opus"
    [[ "$model_id" == *"4"* ]] && model_short="Opus 4"
    [[ "$model_id" == *"4-5"* ]] && model_short="Opus 4.5"
elif [[ "$model_id" == *"haiku"* ]]; then
    model_short="Haiku"
    [[ "$model_id" == *"3-5"* ]] && model_short="Haiku 3.5"
fi

output=""

output+=$(printf "${BLUE}${ICON_FOLDER} %s${RESET}" "$display_dir")

if [ -n "$git_branch" ]; then
    output+=$(printf " ${GRAY}on${RESET} ${PURPLE}${ICON_GIT} %s%s${RESET}" "$git_branch" "$git_status")

    if [ -n "$git_ahead" ] && [ "$git_ahead" != "0" ]; then
        output+=$(printf " ${GREEN}${ICON_AHEAD} %s${RESET}" "$git_ahead")
    fi
    if [ -n "$git_behind" ] && [ "$git_behind" != "0" ]; then
        output+=$(printf " ${RED}${ICON_BEHIND} %s${RESET}" "$git_behind")
    fi
fi

output+=$(printf " ${GRAY}|${RESET}")

output+=$(printf " ${GREEN}${ICON_MODEL} %s${RESET}" "$model_short")

if [ "$output_style" != "default" ] && [ "$output_style" != "null" ]; then
    output+=$(printf " ${CYAN}${ICON_STYLE} %s${RESET}" "$output_style")
fi

if [ -n "$remaining" ]; then
    context_color="$GREEN"
    if (( $(echo "$remaining < 30" | bc -l 2>/dev/null || echo 0) )); then
        context_color="$RED"
    elif (( $(echo "$remaining < 60" | bc -l 2>/dev/null || echo 0) )); then
        context_color="$YELLOW"
    fi
    output+=$(printf " ${context_color}${ICON_CONTEXT} %.0f%%${RESET}" "$remaining")
fi

printf "%b\n" "$output"
