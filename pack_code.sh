#!/bin/bash

OUTPUT="current_code_state.txt"

# 1. Create/Clear the file
echo "Generating project snapshot..." > "$OUTPUT"
echo "Date: $(date)" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# 2. Print Directory Structure
echo "################################################################################" >> "$OUTPUT"
echo "### PROJECT STRUCTURE" >> "$OUTPUT"
echo "################################################################################" >> "$OUTPUT"
# Use 'tree' if available, otherwise fallback to 'find'
if command -v tree &> /dev/null; then
    tree -I "node_modules|.git|assets" >> "$OUTPUT"
else
    find . -maxdepth 3 -not -path '*/.*' >> "$OUTPUT"
fi
echo "" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# 3. Loop through files and append content
echo "################################################################################" >> "$OUTPUT"
echo "### FILE CONTENTS" >> "$OUTPUT"
echo "################################################################################" >> "$OUTPUT"

# Find all files, excluding: .git, node_modules, images, zip files, and this script itself
find . -type f \
    -not -path '*/.*' \
    -not -path '*/node_modules/*' \
    -not -name "*.png" \
    -not -name "*.jpg" \
    -not -name "*.jpeg" \
    -not -name "*.ico" \
    -not -name "*.zip" \
    -not -name "$OUTPUT" \
    -not -name "pack_code.sh" \
    | while read file; do
        
        echo "" >> "$OUTPUT"
        echo "================================================================================" >> "$OUTPUT"
        echo "START FILE: $file" >> "$OUTPUT"
        echo "================================================================================" >> "$OUTPUT"
        
        cat "$file" >> "$OUTPUT"
        
        echo "" >> "$OUTPUT"
        echo "END FILE: $file" >> "$OUTPUT"
        echo "" >> "$OUTPUT"
done

echo "✅ Done! All code saved to: $OUTPUT"