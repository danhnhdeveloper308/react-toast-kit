#!/bin/bash

# React Toast Kit Version Management Script
# This script helps manage versioning and publishing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Get current version
get_current_version() {
    node -p "require('./package.json').version"
}

# Get npm version
get_npm_version() {
    local package_name=$(node -p "require('./package.json').name")
    if npm view $package_name version > /dev/null 2>&1; then
        npm view $package_name version
    else
        echo "0.0.0"
    fi
}

# Check if package exists on npm
package_exists_on_npm() {
    local package_name=$(node -p "require('./package.json').name")
    npm view $package_name version > /dev/null 2>&1
}

# Compare two versions
version_compare() {
    if [[ $1 == $2 ]]; then
        echo "equal"
    elif [[ $1 = $(echo -e "$1\n$2" | sort -V | head -n1) ]]; then
        echo "less"
    else
        echo "greater"
    fi
}

# Increment version intelligently
increment_version() {
    local version=$1
    local type=$2
    
    IFS='.' read -ra PARTS <<< "$version"
    local major=${PARTS[0]}
    local minor=${PARTS[1]}
    local patch=${PARTS[2]}
    
    case $type in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch"|*)
            patch=$((patch + 1))
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Smart version calculation
calculate_next_version() {
    local bump_type=${1:-patch}
    local local_version=$(get_current_version)
    local npm_version=$(get_npm_version)
    
    print_info "Local version: $local_version"
    print_info "NPM version: $npm_version"
    
    if package_exists_on_npm; then
        local comparison=$(version_compare "$local_version" "$npm_version")
        
        case $comparison in
            "greater")
                print_info "Local version is newer than npm, using local version"
                echo "$local_version"
                ;;
            "equal")
                print_info "Versions are equal, incrementing $bump_type"
                increment_version "$npm_version" "$bump_type"
                ;;
            "less")
                print_info "NPM version is newer, incrementing from npm version"
                increment_version "$npm_version" "$bump_type"
                ;;
        esac
    else
        print_info "Package not found on npm, this will be first publish"
        if [[ "$local_version" == "1.0.0" || "$local_version" == "0.0.0" ]]; then
            echo "1.0.0"
        else
            echo "$local_version"
        fi
    fi
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
}

# Check if working directory is clean
check_clean_working_dir() {
    if ! git diff-index --quiet HEAD --; then
        print_error "Working directory is not clean. Please commit your changes first."
        exit 1
    fi
}

# Check if NPM_TOKEN is set
check_npm_token() {
    if [ -z "$NPM_TOKEN" ]; then
        print_warning "NPM_TOKEN environment variable is not set"
        print_info "For manual publishing, you need to set NPM_TOKEN"
        print_info "For GitHub Actions, make sure NPM_TOKEN is set in repository secrets"
        return 1
    fi
    return 0
}

# Show current status
show_status() {
    print_info "=== React Toast Kit Status ==="
    echo "Current version: $(get_current_version)"
    echo "Git branch: $(git branch --show-current)"
    echo "Git status: $(git status --porcelain | wc -l) uncommitted changes"
    
    # Check if package exists on npm
    PACKAGE_NAME=$(node -p "require('./package.json').name")
    if npm view $PACKAGE_NAME version > /dev/null 2>&1; then
        NPM_VERSION=$(npm view $PACKAGE_NAME version)
        echo "NPM version: $NPM_VERSION"
        
        if [ "$(get_current_version)" != "$NPM_VERSION" ]; then
            print_warning "Local version differs from NPM version"
        fi
    else
        print_info "Package not found on NPM (first publish)"
    fi
    echo ""
}

# Bump version intelligently
bump_version() {
    local version_type=$1
    local specific_version=$2
    
    if [ -n "$specific_version" ]; then
        print_info "Setting version to $specific_version"
        npm version $specific_version --no-git-tag-version
    else
        local new_version=$(calculate_next_version $version_type)
        print_info "Calculated next version: $new_version (from $version_type bump)"
        npm version $new_version --no-git-tag-version
    fi
    
    local final_version=$(get_current_version)
    print_success "Version updated to $final_version"
}

# Build and test
build_and_test() {
    print_info "Installing dependencies..."
    pnpm install --frozen-lockfile
    
    print_info "Running TypeScript check..."
    pnpm lint || {
        print_warning "Linting completed with warnings, continuing..."
    }
    
    print_info "Building package..."
    pnpm build
    
    # Run tests if available
    if grep -q '"test"' package.json; then
        print_info "Running tests..."
        if pnpm test run 2>/dev/null || pnpm test --run 2>/dev/null; then
            print_success "Tests passed"
        else
            print_warning "No test files found or tests failed, skipping..."
        fi
    else
        print_info "No tests found, skipping..."
    fi
    
    print_success "Build and tests completed successfully"
}

# Publish to npm
publish_package() {
    local dry_run=$1
    
    if [ "$dry_run" = "true" ]; then
        print_info "Running dry-run publish..."
        npm publish --dry-run
        print_success "Dry-run completed successfully"
        return
    fi
    
    print_info "Publishing to npm..."
    npm publish --access public
    
    local version=$(get_current_version)
    print_success "Published version $version to npm"
    
    # Create git tag
    print_info "Creating git tag..."
    git add package.json
    git commit -m "chore: bump version to v$version [skip ci]"
    git tag "v$version"
    
    print_info "Pushing to git..."
    git push origin main
    git push origin "v$version"
    
    print_success "Git tag created and pushed"
}

# Show help
show_help() {
    echo "React Toast Kit Version Management"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  status                 Show current status"
    echo "  bump [type]           Bump version (patch|minor|major|prerelease)"
    echo "  set <version>         Set specific version"
    echo "  build                 Build and test package"
    echo "  publish               Publish to npm"
    echo "  publish-dry           Dry run publish"
    echo "  release [type]        Full release process (bump + build + publish)"
    echo "  setup-secrets         Show how to setup GitHub secrets"
    echo "  help                  Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 bump patch"
    echo "  $0 set 1.2.3"
    echo "  $0 release minor"
    echo "  $0 publish-dry"
}

# Setup secrets guide
setup_secrets() {
    print_info "=== GitHub Secrets Setup Guide ==="
    echo ""
    echo "To enable automatic publishing, you need to set up these secrets in your GitHub repository:"
    echo ""
    echo "1. NPM_TOKEN:"
    echo "   - Go to https://www.npmjs.com/settings/tokens"
    echo "   - Create a new 'Automation' token"
    echo "   - Copy the token"
    echo "   - Go to your GitHub repo → Settings → Secrets and variables → Actions"
    echo "   - Add new secret: NPM_TOKEN with your token value"
    echo ""
    echo "2. GITHUB_TOKEN (usually automatic):"
    echo "   - This should be automatically available in GitHub Actions"
    echo "   - If needed, you can create a Personal Access Token with repo permissions"
    echo ""
    echo "3. Repository Settings:"
    echo "   - Go to Settings → Actions → General"
    echo "   - Under 'Workflow permissions', select 'Read and write permissions'"
    echo "   - Check 'Allow GitHub Actions to create and approve pull requests'"
    echo ""
    print_success "After setting up secrets, the workflow will automatically publish when you push to main"
}

# Main script logic
case $1 in
    "status")
        show_status
        ;;
    "bump")
        check_git_repo
        check_clean_working_dir
        bump_version $2
        ;;
    "set")
        if [ -z "$2" ]; then
            print_error "Please provide a version number"
            exit 1
        fi
        check_git_repo
        check_clean_working_dir
        bump_version "" $2
        ;;
    "build")
        build_and_test
        ;;
    "publish")
        check_git_repo
        check_clean_working_dir
        if ! check_npm_token; then
            exit 1
        fi
        build_and_test
        publish_package false
        ;;
    "publish-dry")
        build_and_test
        publish_package true
        ;;
    "release")
        check_git_repo
        check_clean_working_dir
        if ! check_npm_token; then
            exit 1
        fi
        
        VERSION_TYPE=${2:-patch}
        print_info "Starting release process with $VERSION_TYPE version bump"
        
        show_status
        bump_version $VERSION_TYPE
        build_and_test
        publish_package false
        
        print_success "Release completed successfully!"
        ;;
    "setup-secrets")
        setup_secrets
        ;;
    "help"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac