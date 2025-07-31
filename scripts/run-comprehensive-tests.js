#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Comprehensive Testing Suite...\n');

// Test configuration
const testConfig = {
  comprehensive: {
    name: 'Canvas Comprehensive Tests',
    file: 'src/lib/__tests__/canvas-comprehensive.test.ts',
    timeout: 60000,
    description: 'Tests all font families, sizes, alignments, and canvas dimensions'
  },
  visual: {
    name: 'Visual Regression Tests',
    file: 'src/lib/__tests__/visual-regression.test.ts',
    timeout: 120000,
    description: 'Generates reference images and compares visual output'
  },
  performance: {
    name: 'Performance Tests',
    file: 'src/lib/__tests__/performance.test.ts',
    timeout: 180000,
    description: 'Measures rendering speed, memory usage, and batch generation'
  },
  userAcceptance: {
    name: 'User Acceptance Tests',
    file: 'src/lib/__tests__/user-acceptance.test.ts',
    timeout: 90000,
    description: 'Validates editor consistency and story content'
  }
};

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

function logSubSection(title) {
  console.log(`\n${colors.bold}${colors.blue}${'-'.repeat(40)}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}${'-'.repeat(40)}${colors.reset}\n`);
}

function runTest(testKey, config) {
  logSubSection(`Running ${config.name}`);
  log(`Description: ${config.description}`, 'cyan');
  log(`File: ${config.file}`, 'magenta');
  log(`Timeout: ${config.timeout}ms`, 'yellow');
  
  const startTime = Date.now();
  
  try {
    // Check if test file exists
    const testPath = path.join(process.cwd(), config.file);
    if (!fs.existsSync(testPath)) {
      throw new Error(`Test file not found: ${config.file}`);
    }
    
    // Run the test
    const command = `npx jest ${config.file} --testTimeout=${config.timeout} --verbose --detectOpenHandles`;
    log(`\nExecuting: ${command}`, 'yellow');
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    const duration = Date.now() - startTime;
    log(`✅ ${config.name} PASSED (${duration}ms)`, 'green');
    
    results.passed++;
    results.details.push({
      test: testKey,
      name: config.name,
      status: 'PASSED',
      duration,
      output: output.slice(-1000) // Last 1000 characters
    });
    
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ ${config.name} FAILED (${duration}ms)`, 'red');
    log(`Error: ${error.message}`, 'red');
    
    if (error.stdout) {
      log('\nStdout:', 'yellow');
      log(error.stdout.slice(-2000), 'reset'); // Last 2000 characters
    }
    
    if (error.stderr) {
      log('\nStderr:', 'yellow');
      log(error.stderr.slice(-1000), 'reset'); // Last 1000 characters
    }
    
    results.failed++;
    results.details.push({
      test: testKey,
      name: config.name,
      status: 'FAILED',
      duration,
      error: error.message,
      output: error.stdout || error.stderr || ''
    });
    
    return false;
  }
}

function generateReport() {
  logSection('Test Execution Summary');
  
  const totalTests = results.passed + results.failed + results.skipped;
  const passRate = totalTests > 0 ? (results.passed / totalTests * 100).toFixed(2) : 0;
  
  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⏭️  Skipped: ${results.skipped}`, 'yellow');
  log(`📊 Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red');
  
  // Detailed results
  console.log('\n' + colors.bold + colors.blue + 'Detailed Results:' + colors.reset);
  results.details.forEach(detail => {
    const statusColor = detail.status === 'PASSED' ? 'green' : 'red';
    log(`\n${detail.test}: ${detail.name}`, 'cyan');
    log(`Status: ${detail.status}`, statusColor);
    log(`Duration: ${detail.duration}ms`, 'yellow');
    
    if (detail.error) {
      log(`Error: ${detail.error}`, 'red');
    }
  });
  
  // Generate JSON report
  const reportPath = path.join(process.cwd(), 'test-results', 'comprehensive-test-report.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const jsonReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      passRate: parseFloat(passRate)
    },
    details: results.details,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2));
  log(`\n📄 Report saved to: ${reportPath}`, 'cyan');
  
  return passRate >= 80;
}

function main() {
  logSection('Comprehensive Testing Suite for Canvas Text Rendering');
  
  log('This suite tests all combinations of:', 'cyan');
  log('• Font families and sizes', 'reset');
  log('• Text alignments (horizontal + vertical)', 'reset');
  log('• Line heights with multi-line text', 'reset');
  log('• Various canvas dimensions', 'reset');
  log('• Visual regression detection', 'reset');
  log('• Performance benchmarks', 'reset');
  log('• User acceptance scenarios', 'reset');
  
  // Check if Jest is available
  try {
    execSync('npx jest --version', { stdio: 'pipe' });
  } catch (error) {
    log('❌ Jest is not available. Please install dependencies first:', 'red');
    log('npm install', 'yellow');
    process.exit(1);
  }
  
  // Clean up any previous test artifacts
  const tempDirs = ['tests/visual-references', 'tests/visual-output'];
  tempDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  });
  
  log('\n🧹 Cleaned up previous test artifacts', 'green');
  
  // Run tests in sequence
  const testOrder = ['comprehensive', 'visual', 'performance', 'userAcceptance'];
  
  for (const testKey of testOrder) {
    if (testConfig[testKey]) {
      const success = runTest(testKey, testConfig[testKey]);
      
      // Add a small delay between tests to prevent resource conflicts
      if (testKey !== testOrder[testOrder.length - 1]) {
        log('⏱️  Waiting 2 seconds before next test...', 'yellow');
        require('child_process').execSync('sleep 2');
      }
    }
  }
  
  // Generate final report
  const overallSuccess = generateReport();
  
  logSection('Recommendations');
  
  if (overallSuccess) {
    log('🎉 All tests passed! Your canvas rendering system is working excellently.', 'green');
    log('\n✅ Recommendations:', 'green');
    log('• Consider setting up continuous integration with these tests', 'reset');
    log('• Monitor performance metrics over time', 'reset');
    log('• Update visual references when UI changes are intentional', 'reset');
  } else {
    log('⚠️  Some tests failed. Please review the issues above.', 'yellow');
    log('\n🔧 Recommendations:', 'yellow');
    log('• Fix failing tests before deploying to production', 'reset');
    log('• Review performance bottlenecks if performance tests failed', 'reset');
    log('• Check visual differences if regression tests failed', 'reset');
    log('• Validate user scenarios match expected behavior', 'reset');
  }
  
  logSection('Next Steps');
  log('1. Review the detailed test report', 'cyan');
  log('2. Address any failing tests', 'cyan');
  log('3. Set up automated testing in your CI/CD pipeline', 'cyan');
  log('4. Schedule regular performance monitoring', 'cyan');
  log('5. Gather real user feedback to complement these tests', 'cyan');
  
  // Exit with appropriate code
  process.exit(overallSuccess ? 0 : 1);
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n\n⚠️  Test execution interrupted by user', 'yellow');
  log('Partial results may be available in test-results/', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\n\n⚠️  Test execution terminated', 'yellow');
  process.exit(143);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  runTest,
  generateReport,
  testConfig,
  colors,
  log
};
