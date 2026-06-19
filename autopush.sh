#!/bin/bash
echo "Starting autopush. Watching for changes in $(pwd)..."
echo "Press Ctrl+C to stop."

while true; do
  # Check if there are any changes (untracked, modified, deleted)
  if [[ -n $(git status -s) ]]; then
    echo "Changes detected! Committing and pushing..."
    git add .
    git commit -m "Autopush: live changes $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin master
    echo "Pushed changes at $(date)"
  fi
  sleep 5
done
