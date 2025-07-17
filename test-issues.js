#!/usr/bin/env node

/**
 * Test script to verify and document the reproduction of issues
 * Run with: node test-issues.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Zamong Text Editor - Issue Reproduction Test');
console.log('================================================\n');

// Test 1: Verify Canvas Context Error patterns in code
console.log('📋 Test 1: Canvas Context Error Code Analysis');
console.log('----------------------------------------------');

const imageGeneratorPath = 'src/components/canvas/ImageGenerator.tsx';
const canvasUtilsPath = 'src/lib/canvas-utils.ts';

function analyzeCanvasIssue() {
  try {
    const imageGeneratorContent = fs.readFileSync(imageGeneratorPath, 'utf8');
    const canvasUtilsContent = fs.readFileSync(canvasUtilsPath, 'utf8');
    
    // Check for problematic patterns
    const issues = [];
    
    // Pattern 1: Canvas disposal in useEffect cleanup
    if (imageGeneratorContent.includes('fabricCanvasRef.current.dispose()')) {
      issues.push('✓ Found canvas disposal in useEffect cleanup');
    }
    
    // Pattern 2: Async image loading without disposal check
    if (canvasUtilsContent.includes('fabric.Image.fromURL') && 
        !canvasUtilsContent.includes('disposed') && 
        !canvasUtilsContent.includes('cancelled')) {
      issues.push('❌ Async image loading without disposal/cancellation check');
    }
    
    // Pattern 3: Canvas renderAll without validity check
    if (canvasUtilsContent.includes('canvas.renderAll()') && 
        !canvasUtilsContent.includes('isValid')) {
      issues.push('❌ Canvas renderAll without validity check');
    }
    
    // Pattern 4: useEffect dependencies that cause recreation
    const useEffectMatch = imageGeneratorContent.match(/useEffect\([^}]+}, \[([^\]]+)\]/);
    if (useEffectMatch && useEffectMatch[1].includes('currentSectionIndex')) {
      issues.push('❌ Canvas recreation on section index change');
    }
    
    console.log('Issues found:');
    issues.forEach(issue => console.log(`  ${issue}`));
    
    return issues.filter(issue => issue.startsWith('❌')).length;
    
  } catch (error) {
    console.log('❌ Error analyzing canvas code:', error.message);
    return 1;
  }
}

// Test 2: Verify Layout Overlap patterns
console.log('\n📱 Test 2: Layout Overlap Code Analysis');
console.log('---------------------------------------');

function analyzeLayoutIssue() {
  try {
    const imageGeneratorContent = fs.readFileSync(imageGeneratorPath, 'utf8');
    const globalCssContent = fs.readFileSync('src/app/globals.css', 'utf8');
    
    const issues = [];
    
    // Pattern 1: Grid layout without medium breakpoint
    if (imageGeneratorContent.includes('lg:grid-cols-2') && 
        !imageGeneratorContent.includes('md:grid-cols')) {
      issues.push('❌ Missing medium breakpoint in grid layout');
    }
    
    // Pattern 2: Fixed canvas width without responsive scaling
    if (imageGeneratorContent.includes("maxWidth: '400px'") && 
        !imageGeneratorContent.includes('responsive') && 
        !imageGeneratorContent.includes('min-width')) {
      issues.push('❌ Fixed canvas width without responsive considerations');
    }
    
    // Pattern 3: No mobile-specific CSS overrides
    if (!globalCssContent.includes('@media') || 
        !globalCssContent.includes('max-width')) {
      issues.push('⚠️ Limited mobile-specific CSS overrides');
    }
    
    // Pattern 4: Container without overflow handling
    if (imageGeneratorContent.includes('grid-cols-1 lg:grid-cols-2') && 
        !imageGeneratorContent.includes('overflow')) {
      issues.push('❌ Grid container without overflow handling');
    }
    
    console.log('Issues found:');
    issues.forEach(issue => console.log(`  ${issue}`));
    
    return issues.filter(issue => issue.startsWith('❌')).length;
    
  } catch (error) {
    console.log('❌ Error analyzing layout code:', error.message);
    return 1;
  }
}

// Test 3: Verify test files exist
console.log('\n🧪 Test 3: Reproduction Environment Verification');
console.log('------------------------------------------------');

function verifyTestEnvironment() {
  const testFiles = [
    'test-reproduction.html',
    'ISSUE_REPRODUCTION_REPORT.md',
    'codesandbox-config.json'
  ];
  
  let missingFiles = 0;
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✓ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      missingFiles++;
    }
  });
  
  return missingFiles;
}

// Test 4: Analyze viewport breakpoints
console.log('\n📐 Test 4: Viewport Breakpoint Analysis');
console.log('---------------------------------------');

function analyzeViewportBreakpoints() {
  try {
    const tailwindConfigPath = 'tailwind.config.js';
    let issues = 0;
    
    if (fs.existsSync(tailwindConfigPath)) {
      const tailwindContent = fs.readFileSync(tailwindConfigPath, 'utf8');
      console.log('✓ Tailwind config found');
      
      // Check for custom breakpoints
      if (!tailwindContent.includes('screens') || !tailwindContent.includes('md:')) {
        console.log('⚠️ No custom mobile breakpoints defined');
        issues++;
      }
    } else {
      console.log('⚠️ Tailwind config not found');
    }
    
    // Standard breakpoints analysis
    const breakpoints = {
      'sm': '640px',
      'md': '768px', 
      'lg': '1024px',
      'xl': '1280px'
    };
    
    console.log('\nStandard Tailwind breakpoints:');
    Object.entries(breakpoints).forEach(([name, size]) => {
      console.log(`  ${name}: ${size}`);
    });
    
    console.log('\nProblem range: 360px - 420px (no specific breakpoint)');
    console.log('Gap between default and sm: breakpoint (0-640px)');
    
    return issues;
    
  } catch (error) {
    console.log('❌ Error analyzing breakpoints:', error.message);
    return 1;
  }
}

// Test 5: Check dependencies
console.log('\n📦 Test 5: Dependency Analysis');
console.log('------------------------------');

function analyzeDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = packageJson.dependencies || {};
    
    console.log('Canvas-related dependencies:');
    if (dependencies.fabric) {
      console.log(`✓ fabric.js: ${dependencies.fabric}`);
    } else {
      console.log('❌ fabric.js not found');
      return 1;
    }
    
    console.log('\nUI/Layout dependencies:');
    if (dependencies['@radix-ui/react-tabs']) {
      console.log(`✓ Radix UI: ${dependencies['@radix-ui/react-tabs']}`);
    }
    
    if (dependencies['tailwindcss']) {
      console.log(`✓ Tailwind CSS: ${dependencies['tailwindcss']}`);
    } else {
      console.log('⚠️ Tailwind CSS not in dependencies (may be in devDependencies)');
    }
    
    return 0;
    
  } catch (error) {
    console.log('❌ Error analyzing dependencies:', error.message);
    return 1;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🏃 Running all tests...\n');
  
  const results = {
    canvasIssues: analyzeCanvasIssue(),
    layoutIssues: analyzeLayoutIssue(), 
    testEnvironment: verifyTestEnvironment(),
    viewportBreakpoints: analyzeViewportBreakpoints(),
    dependencies: analyzeDependencies()
  };
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  const totalIssues = Object.values(results).reduce((sum, count) => sum + count, 0);
  
  console.log(`Canvas Context Issues: ${results.canvasIssues}`);
  console.log(`Layout Overlap Issues: ${results.layoutIssues}`);
  console.log(`Test Environment Issues: ${results.testEnvironment}`);
  console.log(`Viewport Breakpoint Issues: ${results.viewportBreakpoints}`);
  console.log(`Dependency Issues: ${results.dependencies}`);
  console.log(`\nTotal Issues Found: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('\n✅ All tests passed! Issues have been properly documented and reproduced.');
  } else {
    console.log('\n⚠️ Issues confirmed and documented for fixing.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Review ISSUE_REPRODUCTION_REPORT.md for detailed analysis');
  console.log('2. Open test-reproduction.html in browser to see live reproduction');
  console.log('3. Use CodeSandbox config for isolated testing environment');
  console.log('4. Implement fixes based on documented scenarios');
  
  return totalIssues;
}

// Execute if run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  analyzeCanvasIssue,
  analyzeLayoutIssue,
  verifyTestEnvironment,
  analyzeViewportBreakpoints,
  analyzeDependencies,
  runAllTests
};
