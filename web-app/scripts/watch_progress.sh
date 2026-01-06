#!/bin/bash

# Auto-update progress every 10 seconds while the parallel script is running
while true; do
    if pgrep -f "extract_frames_parallel.js" > /dev/null; then
        node scripts/update_progress.js
        sleep 10
    else
        # One final update when script completes
        node scripts/update_progress.js
        echo "GIF generation complete! Progress tracking stopped."
        break
    fi
done
