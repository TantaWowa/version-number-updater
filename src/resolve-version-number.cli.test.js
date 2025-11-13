#!/usr/bin/env node
/**
 * CLI unit tests for resolve-version-number.js
 * Tests the yargs CLI interface, options, and help output
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const scriptPath = resolve(process.cwd(), 'src/resolve-version-number.js');
const pkgPath = resolve(process.cwd(), 'package.json');

// Save original package.json
const originalPkg = readFileSync(pkgPath, 'utf8');

function runCLI(args, options = {}) {
  try {
    const cmd = `node ${scriptPath} ${args}`;
    const output = execSync(cmd, {
      encoding: 'utf8',
      cwd: process.cwd(),
      ...options
    }).trim();
    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      output: error.stdout?.toString() || '',
      error: error.message,
      stderr: error.stderr?.toString() || '',
      code: error.status || error.code
    };
  }
}

function test(name, args, expectedBehavior) {
  try {
    const result = runCLI(args);

    if (expectedBehavior.success !== undefined && result.success !== expectedBehavior.success) {
      console.error(`❌ ${name}: Expected success=${expectedBehavior.success}, got success=${result.success}`);
      if (result.error) console.error(`   Error: ${result.error}`);
      if (result.stderr) console.error(`   stderr: ${result.stderr}`);
      return false;
    }

    if (expectedBehavior.contains && !result.output.includes(expectedBehavior.contains)) {
      console.error(`❌ ${name}: Expected output to contain "${expectedBehavior.contains}"`);
      console.error(`   Got: ${result.output}`);
      return false;
    }

    if (expectedBehavior.notContains && result.output.includes(expectedBehavior.notContains)) {
      console.error(`❌ ${name}: Expected output NOT to contain "${expectedBehavior.notContains}"`);
      console.error(`   Got: ${result.output}`);
      return false;
    }

    if (expectedBehavior.matches && !expectedBehavior.matches.test(result.output)) {
      console.error(`❌ ${name}: Output doesn't match expected pattern`);
      console.error(`   Got: ${result.output}`);
      return false;
    }

    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ ${name}: Test error - ${error.message}`);
    return false;
  }
}

console.log('Running CLI tests for resolve-version-number.js\n');

let passed = 0;
let failed = 0;

// Test help output
console.log('=== Testing Help Documentation ===');
failed += !test('Help flag (-h)', '-h', { success: true, contains: 'Positionals:' }) ? 1 : 0; passed += test('Help flag (-h)', '-h', { success: true, contains: 'Positionals:' }) ? 1 : 0;
failed += !test('Help flag (--help)', '--help', { success: true, contains: 'Positionals:' }) ? 1 : 0; passed += test('Help flag (--help)', '--help', { success: true, contains: 'Positionals:' }) ? 1 : 0;
failed += !test('Help contains examples', '--help', { success: true, contains: 'Examples:' }) ? 1 : 0; passed += test('Help contains examples', '--help', { success: true, contains: 'Examples:' }) ? 1 : 0;
failed += !test('Help contains version input types', '--help', { success: true, contains: 'Version Input Types:' }) ? 1 : 0; passed += test('Help contains version input types', '--help', { success: true, contains: 'Version Input Types:' }) ? 1 : 0;

// Test version flag
console.log('\n=== Testing Version Flag ===');
failed += !test('Version flag (-v)', '-v', { success: true, matches: /^\d+\.\d+\.\d+$/ }) ? 1 : 0; passed += test('Version flag (-v)', '-v', { success: true, matches: /^\d+\.\d+\.\d+$/ }) ? 1 : 0;
failed += !test('Version flag (--version)', '--version', { success: true, matches: /^\d+\.\d+\.\d+$/ }) ? 1 : 0; passed += test('Version flag (--version)', '--version', { success: true, matches: /^\d+\.\d+\.\d+$/ }) ? 1 : 0;

// Test output format options
console.log('\n=== Testing Output Format Options ===');
// Set a test version first
const testPkg = JSON.parse(originalPkg);
testPkg.version = '1.0.8';
writeFileSync(pkgPath, JSON.stringify(testPkg, null, 2) + '\n');

failed += !test('Output format: json (default)', 'minor', { success: true, contains: '"version"' }) ? 1 : 0; passed += test('Output format: json (default)', 'minor', { success: true, contains: '"version"' }) ? 1 : 0;
failed += !test('Output format: --output json', 'minor --output json', { success: true, contains: '"version"' }) ? 1 : 0; passed += test('Output format: --output json', 'minor --output json', { success: true, contains: '"version"' }) ? 1 : 0;
failed += !test('Output format: --output version', 'minor --output version', { success: true, matches: /^1\.1\.0$/ }) ? 1 : 0; passed += test('Output format: --output version', 'minor --output version', { success: true, matches: /^1\.1\.0$/ }) ? 1 : 0;
failed += !test('Output format: --output original', 'minor --output original', { success: true, matches: /^1\.0\.8$/ }) ? 1 : 0; passed += test('Output format: --output original', 'minor --output original', { success: true, matches: /^1\.0\.8$/ }) ? 1 : 0;
failed += !test('Output format: short alias (-f)', 'minor -f version', { success: true, matches: /^1\.1\.0$/ }) ? 1 : 0; passed += test('Output format: short alias (-f)', 'minor -f version', { success: true, matches: /^1\.1\.0$/ }) ? 1 : 0;

// Test override option
console.log('\n=== Testing Override Option ===');
failed += !test('Override option: --override', 'minor --override 2.5.0', { success: true, contains: '"original":"2.5.0"' }) ? 1 : 0; passed += test('Override option: --override', 'minor --override 2.5.0', { success: true, contains: '"original":"2.5.0"' }) ? 1 : 0;
failed += !test('Override option: short alias (-o)', 'patch -o 1.2.3', { success: true, contains: '"original":"1.2.3"' }) ? 1 : 0; passed += test('Override option: short alias (-o)', 'patch -o 1.2.3', { success: true, contains: '"original":"1.2.3"' }) ? 1 : 0;

// Test error handling
console.log('\n=== Testing Error Handling ===');
failed += !test('Missing required argument', '', { success: false }) ? 1 : 0; passed += test('Missing required argument', '', { success: false }) ? 1 : 0;
failed += !test('Invalid output format', 'minor --output invalid', { success: false }) ? 1 : 0; passed += test('Invalid output format', 'minor --output invalid', { success: false }) ? 1 : 0;
failed += !test('Invalid override version', 'minor --override invalid-version', { success: false }) ? 1 : 0; passed += test('Invalid override version', 'minor --override invalid-version', { success: false }) ? 1 : 0;

// Test that basic functionality still works with CLI
console.log('\n=== Testing Basic Functionality via CLI ===');
failed += !test('CLI: bump command', 'bump', { success: true, contains: '"version"' }) ? 1 : 0; passed += test('CLI: bump command', 'bump', { success: true, contains: '"version"' }) ? 1 : 0;
failed += !test('CLI: major command', 'major', { success: true, contains: '"version"' }) ? 1 : 0; passed += test('CLI: major command', 'major', { success: true, contains: '"version"' }) ? 1 : 0;
failed += !test('CLI: specific version', '1.2.3', { success: true, contains: '"version":"1.2.3"' }) ? 1 : 0; passed += test('CLI: specific version', '1.2.3', { success: true, contains: '"version":"1.2.3"' }) ? 1 : 0;

// Restore original package.json
writeFileSync(pkgPath, originalPkg);

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

process.exit(failed > 0 ? 1 : 0);

