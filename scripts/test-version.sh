#!/bin/bash

# Test script for version calculation logic
# This helps verify the auto-versioning works correctly

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Version Calculation Logic${NC}"
echo "=================================="

# Source the version manager functions
source ./scripts/version-manager.sh

echo "📦 Package: $(node -p "require('./package.json').name")"
echo "📍 Current local version: $(get_current_version)"

# Check npm status
if package_exists_on_npm; then
    echo "🌐 NPM version: $(get_npm_version)"
    echo "📊 Comparison: $(version_compare "$(get_current_version)" "$(get_npm_version)")"
else
    echo "🌐 Package not found on NPM (first publish)"
fi

echo ""
echo "🔢 Version Calculations:"
echo "├─ Next patch: $(calculate_next_version patch)"
echo "├─ Next minor: $(calculate_next_version minor)"
echo "└─ Next major: $(calculate_next_version major)"

echo ""
echo -e "${GREEN}✅ Version calculation test completed${NC}"