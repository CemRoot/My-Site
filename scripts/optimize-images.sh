#!/bin/bash

# Image Optimization Script
# This script converts PNG/JPG images to modern formats (WebP and AVIF)
# and optimizes them for web use

set -e

ASSETS_DIR="./src/assets"
QUALITY_WEBP=85
QUALITY_AVIF=80

echo "🖼️  Starting image optimization..."
echo "=================================="

# Check if required tools are installed
check_dependencies() {
    local missing_deps=()

    command -v cwebp >/dev/null 2>&1 || missing_deps+=("webp (install: apt-get install webp)")
    command -v avifenc >/dev/null 2>&1 || missing_deps+=("avif (install: apt-get install libavif-bin)")

    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo "❌ Missing dependencies:"
        printf '%s\n' "${missing_deps[@]}"
        echo ""
        echo "Install missing tools or use online converters:"
        echo "WebP: https://squoosh.app/"
        echo "AVIF: https://avif.io/"
        exit 1
    fi
}

# Optimize a single PNG/JPG file
optimize_image() {
    local input_file="$1"
    local filename=$(basename "$input_file")
    local dirname=$(dirname "$input_file")
    local basename="${filename%.*}"

    echo "Processing: $filename"

    # Convert to WebP
    local webp_output="${dirname}/${basename}.webp"
    if [ ! -f "$webp_output" ] || [ "$input_file" -nt "$webp_output" ]; then
        cwebp -q $QUALITY_WEBP "$input_file" -o "$webp_output" 2>/dev/null
        echo "  ✓ Created WebP: $webp_output"
    else
        echo "  ⏭️  Skipping WebP (up to date)"
    fi

    # Convert to AVIF
    local avif_output="${dirname}/${basename}.avif"
    if [ ! -f "$avif_output" ] || [ "$input_file" -nt "$avif_output" ]; then
        avifenc -s 0 -q $QUALITY_AVIF "$input_file" "$avif_output" 2>/dev/null
        echo "  ✓ Created AVIF: $avif_output"
    else
        echo "  ⏭️  Skipping AVIF (up to date)"
    fi

    # Show size comparison
    local original_size=$(du -h "$input_file" | cut -f1)
    local webp_size=$(du -h "$webp_output" | cut -f1 2>/dev/null || echo "N/A")
    local avif_size=$(du -h "$avif_output" | cut -f1 2>/dev/null || echo "N/A")

    echo "  📊 Sizes: Original: $original_size | WebP: $webp_size | AVIF: $avif_size"
    echo ""
}

# Main execution
main() {
    echo "Checking dependencies..."
    check_dependencies

    echo ""
    echo "Finding images in $ASSETS_DIR..."

    # Find and process all PNG and JPG files
    find "$ASSETS_DIR" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r img; do
        optimize_image "$img"
    done

    echo "=================================="
    echo "✅ Image optimization complete!"
    echo ""
    echo "Next steps:"
    echo "1. If you don't have the tools installed, use online converters:"
    echo "   - Squoosh: https://squoosh.app/"
    echo "   - AVIF.io: https://avif.io/"
    echo "2. Upload the optimized images to your repository"
    echo "3. Deploy and check Speed Insights for improvements"
}

main
