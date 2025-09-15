#!/usr/bin/env node

/**
 * Comprehensive Modular Testing Script for JW Attendant Scheduler
 * Tests all pages, buttons, links, and API endpoints systematically
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://10.92.3.24:3001';

// Test modules configuration
const TEST_MODULES = {
  authentication: {
    name: 'Authentication Module',
    endpoints: [
      { path: '/auth/signin', method: 'GET', expected: 200 },
      { path: '/api/auth/session', method: 'GET', expected: 200 },
      { path: '/api/auth/providers', method: 'GET', expected: 200 }
    ]
  },
  admin: {
    name: 'Admin Dashboard Module', 
    endpoints: [
      { path: '/admin', method: 'GET', expected: [200, 307] },
      { path: '/api/admin/users', method: 'GET', expected: [200, 307] }
    ]
  },
  attendants: {
    name: 'Attendant Management Module',
    endpoints: [
      { path: '/attendants', method: 'GET', expected: [200, 307] },
      { path: '/api/attendants', method: 'GET', expected: [200, 307] }
    ]
  },
  events: {
    name: 'Event Management Module',
    endpoints: [
      { path: '/events', method: 'GET', expected: [200, 307] },
      { path: '/api/events', method: 'GET', expected: [200, 307] }
    ]
  },
  dashboard: {
    name: 'User Dashboard Module',
    endpoints: [
      { path: '/dashboard', method: 'GET', expected: [200, 307] },
      { path: '/api/counts/analytics', method: 'GET', expected: [200, 307] }
    ]
  }
};

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  modules: {}
};

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          redirectLocation: res.headers.location
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testEndpoint(module, endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  const expectedCodes = Array.isArray(endpoint.expected) ? endpoint.expected : [endpoint.expected];
  
  try {
    console.log(`  Testing: ${endpoint.method} ${endpoint.path}`);
    const response = await makeRequest(url, endpoint.method);
    
    const isExpected = expectedCodes.includes(response.statusCode);
    const status = isExpected ? '✅ PASS' : '❌ FAIL';
    
    console.log(`    ${status} - Status: ${response.statusCode}`);
    
    if (response.statusCode === 307 && response.redirectLocation) {
      console.log(`    🔄 Redirects to: ${response.redirectLocation}`);
    }
    
    if (isExpected) {
      results.passed++;
    } else {
      results.failed++;
      console.log(`    Expected: ${expectedCodes.join(' or ')}, Got: ${response.statusCode}`);
    }
    
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      statusCode: response.statusCode,
      expected: expectedCodes,
      passed: isExpected,
      redirectLocation: response.redirectLocation
    };
    
  } catch (error) {
    console.log(`    ❌ ERROR - ${error.message}`);
    results.failed++;
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      error: error.message,
      passed: false
    };
  }
}

async function testModule(moduleName, moduleConfig) {
  console.log(`\n🧪 Testing ${moduleConfig.name}`);
  console.log('='.repeat(50));
  
  const moduleResults = [];
  
  for (const endpoint of moduleConfig.endpoints) {
    const result = await testEndpoint(moduleName, endpoint);
    moduleResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
  }
  
  results.modules[moduleName] = moduleResults;
  
  const modulePassed = moduleResults.filter(r => r.passed).length;
  const moduleTotal = moduleResults.length;
  console.log(`\n📊 Module Summary: ${modulePassed}/${moduleTotal} tests passed`);
  
  return moduleResults;
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Modular Testing');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  for (const [moduleName, moduleConfig] of Object.entries(TEST_MODULES)) {
    await testModule(moduleName, moduleConfig);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 FINAL TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  // Module-by-module breakdown
  console.log('\n📋 MODULE BREAKDOWN:');
  for (const [moduleName, moduleResults] of Object.entries(results.modules)) {
    const passed = moduleResults.filter(r => r.passed).length;
    const total = moduleResults.length;
    const rate = ((passed / total) * 100).toFixed(1);
    console.log(`  ${TEST_MODULES[moduleName].name}: ${passed}/${total} (${rate}%)`);
  }
  
  // Identify issues
  console.log('\n🔍 IDENTIFIED ISSUES:');
  let issueCount = 0;
  for (const [moduleName, moduleResults] of Object.entries(results.modules)) {
    const failedTests = moduleResults.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log(`\n  ${TEST_MODULES[moduleName].name}:`);
      failedTests.forEach(test => {
        issueCount++;
        if (test.error) {
          console.log(`    ❌ ${test.endpoint}: ${test.error}`);
        } else {
          console.log(`    ❌ ${test.endpoint}: Expected ${test.expected.join('/')}, got ${test.statusCode}`);
        }
      });
    }
  }
  
  if (issueCount === 0) {
    console.log('  🎉 No issues found! All modules working correctly.');
  }
  
  console.log('\n' + '='.repeat(60));
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testModule, TEST_MODULES };
