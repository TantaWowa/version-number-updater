#!/usr/bin/env node
/**
 * CLI entry point for resolve-version-number
 * Command-line interface using yargs
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { resolveVersion, validateSemver } from './resolve-version-number.js';

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

