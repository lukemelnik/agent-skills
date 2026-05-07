#!/bin/bash
window_id="$1"
name=$(tmux display-message -t "$window_id" -p '#{window_name}')
if [[ "$name" == "✅ "* ]]; then
    tmux rename-window -t "$window_id" "${name#✅ }"
fi
