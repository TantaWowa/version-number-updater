/**
 * Core version resolution functions
 * Resolves version number from input (major/minor/patch/bump or specific version)
 * Reads current version from package.json and calculates new version if needed
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';

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

export function resolveVersion(input, overrideVersion = null, packageJsonPath = null) {
  if (!input) {
    throw new Error('Version input is required');
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
      throw new Error(`Invalid version format: ${input}. Expected format: x.y.z or x.y.z-prerelease`);
    }

    return {
      original: currentVersion,
      version: input
    };
  }
}

// Export other functions that might be useful
export { getCurrentVersion, bumpPatchVersion, stripPrerelease, calculateBumpVersion, validateSemver };

