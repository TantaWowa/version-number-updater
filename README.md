# resolve-version-number

A lightweight Node.js utility for resolving and calculating semantic version numbers. Perfect for CI/CD pipelines, release automation, and version management workflows.

## Features

- 🎯 **Smart Version Resolution** - Supports semantic versioning with prerelease support
- 🔄 **Multiple Bump Types** - `major`, `minor`, `patch`, and custom `bump` for prerelease increments
- 📦 **Package.json Integration** - Automatically reads from your `package.json`
- 🧪 **Testing Support** - Override current version for testing scenarios
- ✅ **Semver Validation** - Ensures all versions follow semantic versioning standards
- 📤 **JSON Output** - Machine-readable output perfect for CI/CD pipelines
- 🚫 **Non-Destructive** - Never modifies your `package.json` (uses `--no-git-tag-version`)

## Installation

### As a Standalone Script

Copy `resolve-version-number.js` to your project's `scripts/` directory:

curl -o scripts/resolve-version-number.js https://raw.githubusercontent.com/yourusername/resolve-version-number/main/resolve-version-number.js
chmod +x scripts/resolve-version-number.js### As an npm Package (Coming Soon)

npm install resolve-version-number## Requirements

- Node.js 16+ (ES modules support)
- npm (for version calculations)

## Usage

### Basic Usage

# Bump minor version (reads from package.json)
node scripts/resolve-version-number.js minor
# Output: {"original":"1.0.8","version":"1.1.0"}

# Use specific version
node scripts/resolve-version-number.js 1.2.3
# Output: {"original":"1.0.8","version":"1.2.3"}

# Simple patch bump
node scripts/resolve-version-number.js bump
# Output: {"original":"1.0.8","version":"1.0.9"}### With Version Override (for testing)

# Test with a different starting version
node scripts/resolve-version-number.js minor 2.5.0
# Output: {"original":"2.5.0","version":"2.6.0"}
## Version Input Types

### Semantic Version Bumps

- `major` - Increment major version (1.0.8 → 2.0.0)
- `minor` - Increment minor version (1.0.8 → 1.1.0)
- `patch` - Increment patch version (1.0.8 → 1.0.9)

### Custom Bump

- `bump` - Smart increment:
  - Regular versions: Increment patch (1.0.8 → 1.0.9)
  - Prerelease with number: Increment prerelease (1.0.8-rc.1 → 1.0.8-rc.2)
  - Prerelease without number: Increment patch (1.0.8-alpha → 1.0.9-alpha)

### Specific Version

- `x.y.z` - Use exact version (e.g., `1.2.3`)
- `x.y.z-prerelease` - Use exact prerelease version (e.g., `1.2.3-rc.1`)

## Examples

### Prerelease Version Handling

# Increment prerelease number
node scripts/resolve-version-number.js bump 1.0.8-rc.1
# Output: {"o