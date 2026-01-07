#!/usr/bin/env node

/**
 * Test Runner Module for Blue-Green MCP Server
 * Runs Playwright tests for both TheoShift and LDC Tools
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

// Test configurations per app
const TEST_CONFIGS = {
  'theoshift': {
    projectPath: '/Users/cory/Documents/Cloudy-Work/applications/theoshift',
    testUser: 'admin@theoshift.local',
    testPassword: 'AdminPass123!',
    smokeTests: 'tests/smoke-test.spec.ts',
    featureTests: 'tests/**/*.spec.ts',
  },
  'ldc-tools': {
    projectPath: '/Users/cory/Documents/Cloudy-Work/applications/ldc-construction-tools/frontend',
    testUser: 'admin@ldctools.local',
    testPassword: 'AdminPass123!',
    smokeTests: 'tests/smoke-test.spec.ts',
    featureTests: 'tests/phase1-features.spec.ts',
  },
};

/**
 * Run Playwright tests against a server
 * @param {string} app - Application name ('theoshift' or 'ldc-tools')
 * @param {string} baseUrl - Server URL to test against
 * @param {string} testType - Type of tests ('smoke' or 'feature')
 * @returns {Promise<Object>} Test results
 */
async function runTests(app, baseUrl, testType = 'smoke') {
  const config = TEST_CONFIGS[app];
  if (!config) {
    throw new Error(`Unknown app: ${app}`);
  }

  const testFile = testType === 'smoke' ? config.smokeTests : config.featureTests;
  const testCommand = testType === 'smoke' ? 'test:smoke:quick' : 'test:e2e';

  // Build environment variables
  const env = {
    ...process.env,
    BASE_URL: baseUrl,
    TEST_USER_EMAIL: config.testUser,
    TEST_USER_PASSWORD: config.testPassword,
    CI: 'true', // Disable webServer in CI mode
  };

  const envString = Object.entries(env)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(' ');

  try {
    // Run tests
    const command = `cd ${config.projectPath} && ${envString} npm run ${testCommand}`;
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for test output
      timeout: 120000, // 2 minute timeout
    });

    // Parse test results from output
    const output = stdout + stderr;
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const totalMatch = output.match(/Running (\d+) tests?/);

    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;

    return {
      success: failed === 0,
      passed,
      failed,
      total,
      duration: extractDuration(output),
      output: output.substring(0, 5000), // Limit output size
      testType,
    };
  } catch (error) {
    // Test execution failed
    const output = error.stdout + error.stderr;
    const failedMatch = output.match(/(\d+) failed/);
    const passedMatch = output.match(/(\d+) passed/);

    return {
      success: false,
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      total: 0,
      duration: 0,
      output: output.substring(0, 5000),
      error: error.message,
      testType,
    };
  }
}

/**
 * Extract test duration from Playwright output
 * @param {string} output - Test output
 * @returns {number} Duration in seconds
 */
function extractDuration(output) {
  const match = output.match(/(\d+\.?\d*)\s*s\)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Run smoke tests (quick validation)
 * @param {string} app - Application name
 * @param {string} baseUrl - Server URL
 * @returns {Promise<Object>} Test results
 */
async function runSmokeTests(app, baseUrl) {
  return runTests(app, baseUrl, 'smoke');
}

/**
 * Run feature tests (comprehensive validation)
 * @param {string} app - Application name
 * @param {string} baseUrl - Server URL
 * @returns {Promise<Object>} Test results
 */
async function runFeatureTests(app, baseUrl) {
  return runTests(app, baseUrl, 'feature');
}

/**
 * Format test results for display
 * @param {Object} results - Test results
 * @returns {string} Formatted output
 */
function formatResults(results) {
  const status = results.success ? '✅ PASSED' : '❌ FAILED';
  const summary = `${results.passed}/${results.total} tests passed`;
  const duration = `${results.duration.toFixed(1)}s`;

  return `
${status} - ${results.testType.toUpperCase()} TESTS
${summary} in ${duration}

${results.failed > 0 ? `Failed: ${results.failed}` : ''}
${results.error ? `Error: ${results.error}` : ''}
`.trim();
}

module.exports = {
  runTests,
  runSmokeTests,
  runFeatureTests,
  formatResults,
  TEST_CONFIGS,
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const app = args[0] || 'theoshift';
  const baseUrl = args[1] || 'http://10.92.3.24:3001';
  const testType = args[2] || 'smoke';

  console.log(`Running ${testType} tests for ${app} against ${baseUrl}...`);

  runTests(app, baseUrl, testType)
    .then((results) => {
      console.log(formatResults(results));
      process.exit(results.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error.message);
      process.exit(1);
    });
}
