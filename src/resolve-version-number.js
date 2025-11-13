#!/usr/bin/env node
/**
 * Resolves version number from input (major/minor/patch/bump or specific version)
 * Reads current version from package.json and calculates new version if needed
 *
 * Usage:
 *   node scripts/resolve-version-number.js <version-input> [override-current-version]
 *
 * Examples:
 *   node scripts/resolve-version-number.js minor
 *   node scripts/resolve-version-number.js 1.2.3
 *   node scripts/resolve-version-number.js bump
 *   node scripts/resolve-version-number.js minor 1.0.0  # Test with override version
 *
 * Outputs JSON: { version: "1.2.3", original: "1.2.2" }
 * Or exits with error code 1 if invalid
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

function getCurrentVersion(overrideVersion = null, packageJsonPath = null) {
  if (overrideVersion) {
    return overrideVersion;
  }
  const pkgPath = packageJsonPath
    ? resolve(process.cwd(), packageJsonPath)
    : resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (!pkg.version) {
    console.error(`Error: No version found in ${pkgPath}`);
    process.exit(1);
  }
  return pkg.version;
}

function bumpPatchVersion(version) {
  const parts = version.split('-');
  const [major, minor, patch] = parts[0].split('.').map(Number);

  // If there's a prerelease part
  if (parts.length > 1) {
    const prerelease = parts[1];
    // Check if it's already an rc version with a number (e.g., "rc.1")
    const rcMatch = prerelease.match(/^rc\.(\d+)$/);

    if (rcMatch) {
      // Increment the rc number (e.g., rc.1 -> rc.2)
      const rcNumber = parseInt(rcMatch[1], 10) + 1;
      return `${major}.${minor}.${patch}-rc.${rcNumber}`;
    } else {
      // Any other prerelease (with or without number), convert to rc.1
      return `${major}.${minor}.${patch}-rc.1`;
    }
  }

  // No prerelease, add rc.1
  return `${major}.${minor}.${patch}-rc.1`;
}

function stripPrerelease(version) {
  // Remove any prerelease part (e.g., "1.1.0-rc.3" -> "1.1.0")
  const parts = version.split('-');
  return parts[0];
}

function calculateBumpVersion(bumpType, overrideVersion = null, packageJsonPath = null) {
  const pkgPath = packageJsonPath
    ? resolve(process.cwd(), packageJsonPath)
    : resolve(process.cwd(), 'package.json');
  const pkgDir = dirname(pkgPath);
  const originalVersion = getCurrentVersion(overrideVersion, packageJsonPath);
  let pkg = null;
  let originalPkgContent = null;

  // Save original package.json content
  originalPkgContent = readFileSync(pkgPath, 'utf8');
  pkg = JSON.parse(originalPkgContent);

  // If override version is provided, temporarily update package.json
  if (overrideVersion) {
    pkg.version = overrideVersion;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  try {
    // Use npm version to calculate the new version (without committing)
    // Run in the directory containing the package.json
    execSync(`npm version ${bumpType} --no-git-tag-version`, {
      stdio: 'ignore',
      cwd: pkgDir
    });

    const newVersion = getCurrentVersion(null, packageJsonPath);

    // Restore original package.json by writing it back directly
    writeFileSync(pkgPath, originalPkgContent);

    return { original: originalVersion, version: newVersion };
  } catch (error) {
    // Restore original package.json on error
    writeFileSync(pkgPath, originalPkgContent);
    console.error(`Error calculating version bump: ${error.message}`);
    process.exit(1);
  }
}

function validateSemver(version) {
  // Valid semver: x.y.z or x.y.z-prerelease
  const semverRegex = /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$/;
  return semverRegex.test(version);
}

function resolveVersion(input, overrideVersion = null, packageJsonPath = null) {
  if (!input) {
    console.error('Error: Version input is required');
    process.exit(1);
  }

  const inputLower = input.toLowerCase();
  const currentVersion = getCurrentVersion(overrideVersion, packageJsonPath);

  // Check if it's a bump type (major, minor, patch, bump, final)
  if (inputLower === 'major' || inputLower === 'minor' || inputLower === 'patch') {
    const result = calculateBumpVersion(inputLower, overrideVersion, packageJsonPath);
    return result;
  } else if (inputLower === 'bump') {
    // Create/update rc version
    const newVersion = bumpPatchVersion(currentVersion);
    return {
      original: currentVersion,
      version: newVersion
    };
  } else if (inputLower === 'final') {
    // Strip prerelease part to get base version
    const finalVersion = stripPrerelease(currentVersion);
    return {
      original: currentVersion,
      version: finalVersion
    };
  } else {
    // Use specific version as provided
    if (!validateSemver(input)) {
      console.error(`Error: Invalid version format: ${input}`);
      console.error('Expected format: x.y.z or x.y.z-prerelease');
      process.exit(1);
    }

    return {
      original: currentVersion,
      version: input
    };
  }
}

// Main execution with yargs
const argv = yargs(hideBin(process.argv))
  .scriptName('resolve-version-number')
  .usage('$0 <version-input> [options]')
  .command('$0 <version-input>', 'Resolve and calculate semantic version numbers', (yargs) => {
    yargs
      .positional('version-input', {
        describe: 'Version input type or specific version',
        type: 'string',
        demandOption: true
      })
      .option('override', {
        alias: 'o',
        type: 'string',
        describe: 'Override the current version from package.json (useful for testing)',
        default: null
      })
      .option('package-json', {
        alias: 'p',
        type: 'string',
        describe: 'Path to package.json file (default: ./package.json)',
        default: './package.json'
      })
      .option('output', {
        alias: 'f',
        type: 'string',
        describe: 'Output format',
        choices: ['json', 'version', 'original'],
        default: 'json'
      });
  })
  .example('$0 minor', 'Bump minor version (1.0.8 → 1.1.0)')
  .example('$0 major', 'Bump major version (1.0.8 → 2.0.0)')
  .example('$0 patch', 'Bump patch version (1.0.8 → 1.0.9)')
  .example('$0 bump', 'Create/update rc version (1.0.8 → 1.0.8-rc.1)')
  .example('$0 final', 'Strip prerelease to get base version (1.1.0-rc.3 → 1.1.0)')
  .example('$0 1.2.3', 'Use specific version')
  .example('$0 minor --override 2.5.0', 'Test with override version')
  .example('$0 patch --package-json ./custom/package.json', 'Use custom package.json path')
  .example('$0 minor --output version', 'Output only the new version number')
  .epilogue(`
Version Input Types:
  major          Increment major version (1.0.8 → 2.0.0)
  minor          Increment minor version (1.0.8 → 1.1.0)
  patch          Increment patch version (1.0.8 → 1.0.9)
  bump           Always creates/updates rc version:
                 - Regular versions: Add rc.1 (1.0.8 → 1.0.8-rc.1)
                 - rc versions: Increment rc number (1.0.8-rc.1 → 1.0.8-rc.2)
                 - Other prereleases: Convert to rc.1 (1.0.8-beta.5 → 1.0.8-rc.1)
  final          Strip prerelease to get base version:
                 - Removes any prerelease part (1.1.0-rc.3 → 1.1.0)
                 - Works with any prerelease type (1.0.8-beta.5 → 1.0.8)
  x.y.z          Use exact version (e.g., 1.2.3)
  x.y.z-prerelease  Use exact prerelease version (e.g., 1.2.3-rc.1)

Output:
  By default, outputs JSON: {"original":"1.0.8","version":"1.1.0"}
  Use --output version to get only the new version number
  Use --output original to get only the original version number

For more information, visit: https://github.com/yourusername/resolve-version-number
  `)
  .help('h')
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .strict()
  .parseSync();

// Extract arguments
const input = argv.versionInput || argv._[0];
const overrideVersion = argv.override || null;
const packageJsonPath = argv.packageJson || null;
const outputFormat = argv.output || 'json';

// Validate input is provided
if (!input) {
  yargs.showHelp();
  process.exit(1);
}

// Validate override version if provided
if (overrideVersion && !validateSemver(overrideVersion)) {
  console.error(`Error: Invalid override version format: ${overrideVersion}`);
  console.error('Expected format: x.y.z or x.y.z-prerelease');
  process.exit(1);
}

try {
  const result = resolveVersion(input, overrideVersion, packageJsonPath);

  // Output based on format
  switch (outputFormat) {
    case 'version':
      console.log(result.version);
      break;
    case 'original':
      console.log(result.original);
      break;
    case 'json':
    default:
      console.log(JSON.stringify(result));
      break;
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

