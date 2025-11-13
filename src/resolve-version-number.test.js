#!/usr/bin/env node
/**
 * Unit tests for resolve-version-number.js
 * Run with: node scripts/resolve-version-number.js
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const scriptPath = resolve(process.cwd(), 'src/cli.js');
const testDataPath = resolve(process.cwd(), 'test-data');
const testPkgPath = resolve(testDataPath, 'package.json');

// Save original test package.json
const originalTestPkg = readFileSync(testPkgPath, 'utf8');

function runScript(input, overrideVersion = null) {
  try {
    const cmd = overrideVersion
      ? `node ${scriptPath} ${input} --override ${overrideVersion} --package-json package.json`
      : `node ${scriptPath} ${input} --package-json package.json`;
    const output = execSync(cmd, { encoding: 'utf8', cwd: testDataPath }).trim();
    return JSON.parse(output);
  } catch (error) {
    return { error: error.message, stdout: error.stdout?.toString(), stderr: error.stderr?.toString() };
  }
}

function test(name, input, testVersion, expected) {
  // Set test package.json version
  const pkg = JSON.parse(originalTestPkg);
  pkg.version = testVersion;
  writeFileSync(testPkgPath, JSON.stringify(pkg, null, 2) + '\n');

  try {
    const result = runScript(input, null);

    if (result.error) {
      console.error(`❌ ${name}: Error - ${result.error}`);
      if (result.stderr) console.error(`   stderr: ${result.stderr}`);
      return false;
    }

    if (result.version === expected.version && result.original === expected.original) {
      console.log(`✅ ${name}: ${result.original} → ${result.version}`);
      return true;
    } else {
      console.error(`❌ ${name}: Expected ${expected.original} → ${expected.version}, got ${result.original} → ${result.version}`);
      return false;
    }
  } finally {
    // Restore original test package.json
    writeFileSync(testPkgPath, originalTestPkg);
  }
}

console.log('Running tests for resolve-version-number.js\n');

let passed = 0;
let failed = 0;

// Test cases for "bump" option
console.log('=== Testing "bump" option ===');
failed += !test('bump: 1.0.8 → 1.0.8-rc.1', 'bump', '1.0.8', { original: '1.0.8', version: '1.0.8-rc.1' }) ? 1 : 0; passed += test('bump: 1.0.8 → 1.0.8-rc.1', 'bump', '1.0.8', { original: '1.0.8', version: '1.0.8-rc.1' }) ? 1 : 0;
failed += !test('bump: 1.0.8-rc.1 → 1.0.8-rc.2', 'bump', '1.0.8-rc.1', { original: '1.0.8-rc.1', version: '1.0.8-rc.2' }) ? 1 : 0; passed += test('bump: 1.0.8-rc.1 → 1.0.8-rc.2', 'bump', '1.0.8-rc.1', { original: '1.0.8-rc.1', version: '1.0.8-rc.2' }) ? 1 : 0;
failed += !test('bump: 1.0.8-beta.5 → 1.0.8-rc.1', 'bump', '1.0.8-beta.5', { original: '1.0.8-beta.5', version: '1.0.8-rc.1' }) ? 1 : 0; passed += test('bump: 1.0.8-beta.5 → 1.0.8-rc.1', 'bump', '1.0.8-beta.5', { original: '1.0.8-beta.5', version: '1.0.8-rc.1' }) ? 1 : 0;
failed += !test('bump: 1.0.8-alpha → 1.0.8-rc.1', 'bump', '1.0.8-alpha', { original: '1.0.8-alpha', version: '1.0.8-rc.1' }) ? 1 : 0; passed += test('bump: 1.0.8-alpha → 1.0.8-rc.1', 'bump', '1.0.8-alpha', { original: '1.0.8-alpha', version: '1.0.8-rc.1' }) ? 1 : 0;
failed += !test('bump: 2.5.10 → 2.5.10-rc.1', 'bump', '2.5.10', { original: '2.5.10', version: '2.5.10-rc.1' }) ? 1 : 0; passed += test('bump: 2.5.10 → 2.5.10-rc.1', 'bump', '2.5.10', { original: '2.5.10', version: '2.5.10-rc.1' }) ? 1 : 0;
failed += !test('bump: 1.2.3-rc.99 → 1.2.3-rc.100', 'bump', '1.2.3-rc.99', { original: '1.2.3-rc.99', version: '1.2.3-rc.100' }) ? 1 : 0; passed += test('bump: 1.2.3-rc.99 → 1.2.3-rc.100', 'bump', '1.2.3-rc.99', { original: '1.2.3-rc.99', version: '1.2.3-rc.100' }) ? 1 : 0;

console.log('\n=== Testing "major" option ===');
failed += !test('major: 1.0.8 → 2.0.0', 'major', '1.0.8', { original: '1.0.8', version: '2.0.0' }) ? 1 : 0; passed += test('major: 1.0.8 → 2.0.0', 'major', '1.0.8', { original: '1.0.8', version: '2.0.0' }) ? 1 : 0;
failed += !test('major: 5.0.0 → 6.0.0', 'major', '5.0.0', { original: '5.0.0', version: '6.0.0' }) ? 1 : 0; passed += test('major: 5.0.0 → 6.0.0', 'major', '5.0.0', { original: '5.0.0', version: '6.0.0' }) ? 1 : 0;
failed += !test('major: 1.2.3-rc.1 → 2.0.0', 'major', '1.2.3-rc.1', { original: '1.2.3-rc.1', version: '2.0.0' }) ? 1 : 0; passed += test('major: 1.2.3-rc.1 → 2.0.0', 'major', '1.2.3-rc.1', { original: '1.2.3-rc.1', version: '2.0.0' }) ? 1 : 0;

console.log('\n=== Testing "minor" option ===');
failed += !test('minor: 1.0.8 → 1.1.0', 'minor', '1.0.8', { original: '1.0.8', version: '1.1.0' }) ? 1 : 0; passed += test('minor: 1.0.8 → 1.1.0', 'minor', '1.0.8', { original: '1.0.8', version: '1.1.0' }) ? 1 : 0;
failed += !test('minor: 2.5.10 → 2.6.0', 'minor', '2.5.10', { original: '2.5.10', version: '2.6.0' }) ? 1 : 0; passed += test('minor: 2.5.10 → 2.6.0', 'minor', '2.5.10', { original: '2.5.10', version: '2.6.0' }) ? 1 : 0;

console.log('\n=== Testing "patch" option ===');
failed += !test('patch: 1.0.8 → 1.0.9', 'patch', '1.0.8', { original: '1.0.8', version: '1.0.9' }) ? 1 : 0; passed += test('patch: 1.0.8 → 1.0.9', 'patch', '1.0.8', { original: '1.0.8', version: '1.0.9' }) ? 1 : 0;
failed += !test('patch: 1.2.3-beta.1 → 1.2.3', 'patch', '1.2.3-beta.1', { original: '1.2.3-beta.1', version: '1.2.3' }) ? 1 : 0; passed += test('patch: 1.2.3-beta.1 → 1.2.3', 'patch', '1.2.3-beta.1', { original: '1.2.3-beta.1', version: '1.2.3' }) ? 1 : 0;

console.log('\n=== Testing "final" option ===');
failed += !test('final: 1.1.0-rc.3 → 1.1.0', 'final', '1.1.0-rc.3', { original: '1.1.0-rc.3', version: '1.1.0' }) ? 1 : 0; passed += test('final: 1.1.0-rc.3 → 1.1.0', 'final', '1.1.0-rc.3', { original: '1.1.0-rc.3', version: '1.1.0' }) ? 1 : 0;
failed += !test('final: 1.0.8-rc.1 → 1.0.8', 'final', '1.0.8-rc.1', { original: '1.0.8-rc.1', version: '1.0.8' }) ? 1 : 0; passed += test('final: 1.0.8-rc.1 → 1.0.8', 'final', '1.0.8-rc.1', { original: '1.0.8-rc.1', version: '1.0.8' }) ? 1 : 0;
failed += !test('final: 2.5.10-beta.5 → 2.5.10', 'final', '2.5.10-beta.5', { original: '2.5.10-beta.5', version: '2.5.10' }) ? 1 : 0; passed += test('final: 2.5.10-beta.5 → 2.5.10', 'final', '2.5.10-beta.5', { original: '2.5.10-beta.5', version: '2.5.10' }) ? 1 : 0;
failed += !test('final: 1.2.3-alpha → 1.2.3', 'final', '1.2.3-alpha', { original: '1.2.3-alpha', version: '1.2.3' }) ? 1 : 0; passed += test('final: 1.2.3-alpha → 1.2.3', 'final', '1.2.3-alpha', { original: '1.2.3-alpha', version: '1.2.3' }) ? 1 : 0;
failed += !test('final: 3.0.0 → 3.0.0', 'final', '3.0.0', { original: '3.0.0', version: '3.0.0' }) ? 1 : 0; passed += test('final: 3.0.0 → 3.0.0', 'final', '3.0.0', { original: '3.0.0', version: '3.0.0' }) ? 1 : 0;

console.log('\n=== Testing specific version input ===');
failed += !test('specific: 1.0.9', '1.0.9', '1.0.8', { original: '1.0.8', version: '1.0.9' }) ? 1 : 0; passed += test('specific: 1.0.9', '1.0.9', '1.0.8', { original: '1.0.8', version: '1.0.9' }) ? 1 : 0;
failed += !test('specific: 2.0.0-rc.1', '2.0.0-rc.1', '1.0.8', { original: '1.0.8', version: '2.0.0-rc.1' }) ? 1 : 0; passed += test('specific: 2.0.0-rc.1', '2.0.0-rc.1', '1.0.8', { original: '1.0.8', version: '2.0.0-rc.1' }) ? 1 : 0;

console.log('\n=== Testing validation ===');
const invalidResult = runScript('invalid-version');
if (invalidResult.error || invalidResult.version) {
  console.log(`✅ Invalid version rejected`);
  passed++;
} else {
  console.error(`❌ Invalid version should be rejected`);
  failed++;
}

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

process.exit(failed > 0 ? 1 : 0);

