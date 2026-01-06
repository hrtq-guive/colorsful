#!/bin/bash

# Upload all captures to R2
# This uploads the entire captures folder to the R2 bucket

BUCKET_NAME="colorsful-assets"
LOCAL_PATH="public/captures"

echo "🚀 Starting upload to R2..."
echo "📁 Uploading from: $LOCAL_PATH"
echo "🪣 To bucket: $BUCKET_NAME"
echo ""

# Upload all files in the captures directory
for file in "$LOCAL_PATH"/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "⬆️  Uploading: $filename"
        npx wrangler r2 object put "$BUCKET_NAME/captures/$filename" --file="$file"
    fi
done

echo ""
echo "✅ Upload complete!"
echo "🌐 Your assets are now available at:"
echo "   https://pub-50257ec5744e409ba7e6b196bd71e679.r2.dev/captures/"
