#!/bin/bash

# Delete all existing captures so they get regenerated without logos
# The parallel script will then regenerate them with the new crop filter

echo "🗑️  Deleting existing captures to force regeneration..."
echo ""

CAPTURES_DIR="public/captures"
count=$(ls -1 "$CAPTURES_DIR"/*.{gif,jpg} 2>/dev/null | wc -l | tr -d ' ')

if [ "$count" -eq 0 ]; then
    echo "No files to delete."
    exit 0
fi

echo "Found $count files to delete"
read -p "Are you sure you want to delete all existing captures? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

rm -f "$CAPTURES_DIR"/*.gif "$CAPTURES_DIR"/*.jpg

echo ""
echo "✅ Deleted $count files"
echo "The parallel script will now regenerate them without logos."
echo ""
echo "Run: node scripts/extract_frames_parallel.js"
