# Comprehensive Testing Suite

This document describes the comprehensive testing suite implemented for the Zamong Text Editor canvas rendering system. The testing suite covers all aspects of text rendering, visual consistency, performance, and user acceptance.

## Overview

The testing suite consists of four major test categories:

1. **Canvas Comprehensive Tests** - Test all combinations of fonts, sizes, alignments, and canvas dimensions
2. **Visual Regression Tests** - Generate reference images and detect visual changes
3. **Performance Tests** - Measure rendering speed, memory usage, and batch generation
4. **User Acceptance Tests** - Validate editor consistency and story content

## Quick Start

### Run All Tests
```bash
npm run test:comprehensive
```

### Run Individual Test Suites
```bash
# Canvas functionality tests
npm run test:canvas

# Visual regression tests
npm run test:visual

# Performance benchmarks
npm run test:performance

# User acceptance tests
npm run test:acceptance
```

## Test Suite Details

### 1. Canvas Comprehensive Tests
**File:** `src/lib/__tests__/canvas-comprehensive.test.ts`  
**Timeout:** 60 seconds

Tests all combinations of:
- **Font Families:** 나눔손글씨, 학교안심, 학교안심 Regular
- **Font Sizes:** 24px, 36px, 48px, 64px
- **Horizontal Alignments:** left, center, right
- **Vertical Alignments:** top, middle, bottom
- **Line Heights:** 1.2, 1.5, 1.8, 2.0
- **Canvas Dimensions:** 
  - Standard (900×1600)
  - Instagram Story (1080×1920)
  - Facebook Cover (1200×630)  
  - Square (800×800)

**Coverage:**
- Font rendering with all available fonts
- Text alignment in all combinations
- Multi-line text with different line heights
- Various canvas sizes and aspect ratios
- Error handling for edge cases
- Configuration merging and fallbacks

### 2. Visual Regression Tests
**File:** `src/lib/__tests__/visual-regression.test.ts`  
**Timeout:** 120 seconds

**Features:**
- **Reference Image Generation:** Creates baseline images for comparison
- **Visual Comparison:** Detects pixel-level differences between renders
- **Hash-based Matching:** Uses content hashing for efficient comparison
- **Test Scenarios:**
  - Basic Korean text with default settings
  - Centered large text
  - Multi-line mixed Korean-English content
  - Right-aligned bottom text
  - Square canvas with centered text
  - Text with background images

**Output Directories:**
- `tests/visual-references/` - Reference images and metadata
- `tests/visual-output/` - Current test outputs for comparison

### 3. Performance Tests
**File:** `src/lib/__tests__/performance.test.ts`  
**Timeout:** 180 seconds

**Metrics Measured:**
- **Canvas Creation Speed:** Time to create and dispose canvases
- **Text Rendering Performance:** Time to render text with various settings
- **Image Export Speed:** Time to export canvases as images
- **Batch Generation:** Throughput for multiple image generation
- **Memory Usage:** Peak and ongoing memory consumption
- **Stress Testing:** Performance degradation over time

**Performance Targets:**
- Canvas creation: >10 operations/second
- Text rendering: >2 operations/second  
- Image export: >1 operation/second
- Batch generation: >0.5 operations/second
- Memory: No significant leaks over 100 operations

### 4. User Acceptance Tests
**File:** `src/lib/__tests__/user-acceptance.test.ts`  
**Timeout:** 90 seconds

**Validation Areas:**
- **Editor Preview Consistency:** Ensures preview matches generated output
- **Story Content Validation:** Checks for content issues and provides recommendations
- **User Feedback Analysis:** Simulates user feedback collection and analysis
- **Real Story Scenarios:** Tests with actual story content patterns
- **Cross-Device Consistency:** Validates rendering across different viewport sizes
- **Accessibility:** Checks readability requirements

**Test Scenarios:**
- Short children's stories
- Long narrative text
- Mixed Korean-English content
- Poetry with line breaks
- Edge cases (empty content, special characters)

## Test Configuration

### Jest Configuration
The tests use the existing Jest configuration with additional timeout settings for long-running tests.

### Mocking Strategy
- **Fabric.js:** Mocked for consistent test behavior
- **DOM APIs:** Canvas and fetch APIs are mocked
- **File System:** Mocked for visual regression testing
- **Performance APIs:** Memory measurement is mocked when unavailable

### Environment Setup
Tests run in a jsdom environment with additional Node.js APIs available for file operations and performance measurement.

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install
```

### Individual Test Commands

```bash
# Run comprehensive canvas tests
npm run test:canvas

# Run visual regression tests
npm run test:visual

# Run performance benchmarks
npm run test:performance

# Run user acceptance tests  
npm run test:acceptance

# Run all tests with detailed reporting
npm run test:comprehensive
```

### Test Output

The comprehensive test runner provides:
- **Colored Console Output:** Clear visual feedback on test status
- **Detailed Timing:** Performance metrics for each test suite
- **JSON Report:** Structured test results saved to `test-results/comprehensive-test-report.json`
- **Error Details:** Comprehensive error information for failed tests

## Interpreting Results

### Success Criteria
- **Pass Rate:** ≥80% for overall success
- **Performance:** All operations meet minimum speed requirements
- **Visual Consistency:** No unexpected visual regressions
- **User Scenarios:** ≥75% of real story scenarios pass

### Common Issues and Solutions

#### Canvas Creation Failures
```bash
# Check fabric.js installation
npm list fabric

# Verify Node.js version compatibility
node --version
```

#### Visual Regression Failures
- Check if UI changes are intentional
- Update reference images if changes are expected
- Verify font loading is working correctly

#### Performance Issues
- Check system resources during test execution
- Monitor memory usage patterns
- Identify bottlenecks in rendering pipeline

#### User Acceptance Failures
- Review story content validation rules
- Check editor settings consistency
- Validate accessibility requirements

## Continuous Integration

### CI/CD Integration
Add to your CI pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Comprehensive Tests
  run: npm run test:comprehensive
  
- name: Upload Test Results
  uses: actions/upload-artifact@v2
  with:
    name: test-results
    path: test-results/
```

### Performance Monitoring
- Set up alerts for performance degradation
- Track metrics over time
- Compare performance across different environments

## Customization

### Adding New Test Cases

#### Canvas Tests
Add new test combinations in `canvas-comprehensive.test.ts`:
```javascript
const newTestDimensions = [
  { width: 1200, height: 800, name: 'Custom Size' }
];
```

#### Visual Tests
Add new visual scenarios in `visual-regression.test.ts`:
```javascript
const newTestCase = {
  id: 'custom-scenario',
  name: 'Custom Test Scenario',
  description: 'Description of the test',
  config: { /* test configuration */ }
};
```

#### Performance Tests
Add new performance benchmarks in `performance.test.ts`:
```javascript
async measureCustomOperation(iterations) {
  // Custom performance measurement
}
```

### Modifying Test Criteria
Update success criteria in the respective test files:
- Performance thresholds
- Visual comparison sensitivity
- User acceptance pass rates

## Troubleshooting

### Common Setup Issues

#### Missing Dependencies
```bash
npm install --save-dev @types/jest jest-environment-jsdom
```

#### Test Timeouts
Increase timeout values in individual test commands:
```bash
jest --testTimeout=300000  # 5 minutes
```

#### Memory Issues
```bash
node --max-old-space-size=4096 node_modules/.bin/jest
```

### Debug Mode
Run tests with additional debugging:
```bash
DEBUG=* npm run test:comprehensive
```

## Best Practices

### Test Maintenance
1. **Regular Updates:** Keep reference images current with UI changes
2. **Performance Baselines:** Update performance expectations as system improves
3. **Content Validation:** Add new validation rules as edge cases are discovered
4. **Accessibility:** Regularly review and update accessibility requirements

### Test Development
1. **Isolation:** Each test should be independent and repeatable
2. **Clarity:** Test names and descriptions should clearly indicate what is being tested
3. **Coverage:** Aim for comprehensive coverage of all code paths
4. **Performance:** Tests themselves should be efficient and not wasteful of resources

## Reporting Issues

When reporting test failures, include:
1. Full test output
2. System information (OS, Node.js version)
3. Test configuration used
4. Steps to reproduce
5. Expected vs actual behavior

## Contributing

To contribute to the testing suite:
1. Follow the existing patterns and conventions
2. Add appropriate documentation
3. Ensure new tests are reliable and maintainable
4. Update this README if adding new test categories
5. Test your changes across different environments

---

For more information about the Zamong Text Editor project, see the main README.md file.
