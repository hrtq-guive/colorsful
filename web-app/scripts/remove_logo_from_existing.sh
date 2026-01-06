#!/bin/bash

# Script to re-process existing GIFs/JPGs to remove the logo watermark
# This will overwrite existing files with logo-free versions

echo "🔄 Re-processing existing captures to remove logo watermark..."
echo ""

CAPTURES_DIR="public/captures"
TEMP_DIR="$CAPTURES_DIR/temp_reprocess"
mkdir -p "$TEMP_DIR"

processed=0
total=$(ls -1 "$CAPTURES_DIR"/*.{gif,jpg} 2>/dev/null | wc -l | tr -d ' ')

echo "Found $total files to reprocess"
echo ""

for file in "$CAPTURES_DIR"/*.gif "$CAPTURES_DIR"/*.jpg; do
    [ -e "$file" ] || continue
    
    filename=$(basename "$file")
    temp_file="$TEMP_DIR/$filename"
    
    # Determine if GIF or JPG and apply appropriate filter
    if [[ "$filename" == *.gif ]]; then
        # For GIFs: crop then regenerate with same settings
        ffmpeg -i "$file" -vf "crop=in_w-90:in_h-90:0:0" -y "$temp_file" 2>/dev/null
    else
        # For JPGs: crop with same quality
        ffmpeg -i "$file" -vf "crop=in_w-90:in_h-90:0:0" -q:v 2 -y "$temp_file" 2>/dev/null
    fi
    
    if [ -f "$temp_file" ]; then
        mv "$temp_file" "$file"
        ((processed++))
        
        if [ $((processed % 10)) -eq 0 ]; then
            echo "✅ Processed $processed/$total files..."
        fi
    fi
done

# Cleanup
rmdir "$TEMP_DIR" 2>/dev/null

echo ""
echo "🎉 Complete! Reprocessed $processed files"
echo "All captures now have the logo watermark removed."
