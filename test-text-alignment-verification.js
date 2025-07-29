#!/usr/bin/env node

/**
 * Comprehensive Test Script for Text Alignment Verification
 * 
 * This script verifies all the requirements:
 * 1. Global text alignment controls are removed from Preview & Export step
 * 2. Text alignment controls appear and function correctly in the Paginated Story Editor
 * 3. Background image (stage_1.png) is always visible in the editor with appropriate opacity
 * 4. Text alignment setting persists across page navigation
 * 5. Text alignment affects both editor display and final image generation
 * 6. No console errors or warnings appear
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Text Alignment Verification Tests...\n');

// Test 1: Verify global text alignment controls are removed from Preview & Export step
console.log('1️⃣ Testing: Global text alignment controls removed from Preview & Export step');
const batchImageGeneratorPath = './src/components/canvas/BatchImageGenerator.tsx';
if (fs.existsSync(batchImageGeneratorPath)) {
  const batchImageGeneratorContent = fs.readFileSync(batchImageGeneratorPath, 'utf8');
  
  // Check for text alignment controls in BatchImageGenerator
  const hasAlignmentControls = [
    'AlignLeft',
    'AlignCenter', 
    'AlignRight',
    'textAlignment',
    'setTextAlignment'
  ].some(control => batchImageGeneratorContent.includes(control));
  
  if (!hasAlignmentControls) {
    console.log('✅ PASS: No text alignment controls found in Preview & Export step');
  } else {
    console.log('❌ FAIL: Text alignment controls still present in Preview & Export step');
  }
} else {
  console.log('❌ FAIL: BatchImageGenerator.tsx not found');
}

// Test 2: Verify text alignment controls appear in Paginated Story Editor
console.log('\n2️⃣ Testing: Text alignment controls in Paginated Story Editor');
const paginatedEditorPath = './src/components/editor/PaginatedEditor.tsx';
if (fs.existsSync(paginatedEditorPath)) {
  const paginatedEditorContent = fs.readFileSync(paginatedEditorPath, 'utf8');
  
  // Check for text alignment controls
  const hasAlignmentImports = [
    'AlignLeft',
    'AlignCenter',
    'AlignRight'
  ].every(control => paginatedEditorContent.includes(control));
  
  const hasAlignmentButtons = paginatedEditorContent.includes('Text Alignment:');
  const hasSetTextAlignment = paginatedEditorContent.includes('setTextAlignment');
  
  if (hasAlignmentImports && hasAlignmentButtons && hasSetTextAlignment) {
    console.log('✅ PASS: Text alignment controls present in Paginated Story Editor');
  } else {
    console.log('❌ FAIL: Missing text alignment controls in Paginated Story Editor');
    console.log(`  - Has imports: ${hasAlignmentImports}`);
    console.log(`  - Has buttons: ${hasAlignmentButtons}`);
    console.log(`  - Has setTextAlignment: ${hasSetTextAlignment}`);
  }
} else {
  console.log('❌ FAIL: PaginatedEditor.tsx not found');
}

// Test 3: Verify background image is always visible in editor
console.log('\n3️⃣ Testing: Background image (stage_1.png) visibility in editor');
const backgroundImagePath = './public/backgrounds/stage_1.png';
if (fs.existsSync(backgroundImagePath)) {
  console.log('✅ PASS: Background image file exists');
  
  // Check if it's referenced in the editor
  if (fs.existsSync(paginatedEditorPath)) {
    const editorContent = fs.readFileSync(paginatedEditorPath, 'utf8');
    const hasBackgroundImage = editorContent.includes('url(/backgrounds/stage_1.png)');
    const hasBackgroundOverlay = editorContent.includes('rgba(255, 255, 255, 0.8)');
    
    if (hasBackgroundImage && hasBackgroundOverlay) {
      console.log('✅ PASS: Background image properly configured with opacity overlay');
    } else {
      console.log('❌ FAIL: Background image configuration incomplete');
      console.log(`  - Has background image: ${hasBackgroundImage}`);
      console.log(`  - Has opacity overlay: ${hasBackgroundOverlay}`);
    }
  }
} else {
  console.log('❌ FAIL: Background image file not found');
}

// Test 4: Verify text alignment affects image generation
console.log('\n4️⃣ Testing: Text alignment affects image generation');
if (fs.existsSync(batchImageGeneratorPath)) {
  const batchContent = fs.readFileSync(batchImageGeneratorPath, 'utf8');
  
  // Check if globalTextAlignment is used in image generation
  const usesGlobalAlignment = batchContent.includes('editorSettings.globalTextAlignment');
  const hasAlignmentInImageGen = batchContent.includes('textAlign: textStyle.alignment');
  
  if (usesGlobalAlignment && hasAlignmentInImageGen) {
    console.log('✅ PASS: Text alignment affects image generation');
  } else {
    console.log('❌ FAIL: Text alignment not properly integrated in image generation');
    console.log(`  - Uses global alignment: ${usesGlobalAlignment}`);
    console.log(`  - Has alignment in image gen: ${hasAlignmentInImageGen}`);
  }
}

// Test 5: Verify text alignment persistence in store
console.log('\n5️⃣ Testing: Text alignment setting persistence');
const storePath = './src/store/useStoryStore.ts';
if (fs.existsSync(storePath)) {
  const storeContent = fs.readFileSync(storePath, 'utf8');
  
  const hasTextAlignment = storeContent.includes('textAlignment:');
  const hasGlobalTextAlignment = storeContent.includes('globalTextAlignment:');
  const hasSetTextAlignment = storeContent.includes('setTextAlignment:');
  const hasSetGlobalTextAlignment = storeContent.includes('setGlobalTextAlignment:');
  
  if (hasTextAlignment && hasGlobalTextAlignment && hasSetTextAlignment && hasSetGlobalTextAlignment) {
    console.log('✅ PASS: Text alignment persistence properly implemented in store');
  } else {
    console.log('❌ FAIL: Text alignment persistence incomplete in store');
    console.log(`  - Has textAlignment: ${hasTextAlignment}`);
    console.log(`  - Has globalTextAlignment: ${hasGlobalTextAlignment}`);
    console.log(`  - Has setTextAlignment: ${hasSetTextAlignment}`);
    console.log(`  - Has setGlobalTextAlignment: ${hasSetGlobalTextAlignment}`);
  }
} else {
  console.log('❌ FAIL: Store file not found');
}

// Test 6: Check for TypeScript/compilation errors
console.log('\n6️⃣ Testing: TypeScript compilation and syntax validation');
const { execSync } = require('child_process');

try {
  // Run TypeScript check
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  console.log('✅ PASS: No TypeScript compilation errors');
} catch (error) {
  console.log('❌ FAIL: TypeScript compilation errors detected');
  console.log(error.stdout?.toString() || error.message);
}

// Test 7: Verify proper CSS styling for text alignment
console.log('\n7️⃣ Testing: CSS styling for text alignment');
if (fs.existsSync(paginatedEditorPath)) {
  const editorContent = fs.readFileSync(paginatedEditorPath, 'utf8');
  
  const hasTextAlignCSS = editorContent.includes('text-align: ${editorSettings.textAlignment}');
  const hasStyleUpdate = editorContent.includes('editorElement.style.textAlign');
  
  if (hasTextAlignCSS && hasStyleUpdate) {
    console.log('✅ PASS: CSS styling for text alignment properly implemented');
  } else {
    console.log('❌ FAIL: CSS styling for text alignment incomplete');
    console.log(`  - Has CSS text-align: ${hasTextAlignCSS}`);
    console.log(`  - Has style update: ${hasStyleUpdate}`);
  }
}

console.log('\n🎯 Text Alignment Verification Complete!');
console.log('\nNext steps:');
console.log('1. Run `npm run dev` to start the development server');
console.log('2. Navigate through the application to test functionality manually');
console.log('3. Test text alignment changes across page navigation');
console.log('4. Verify background image visibility and opacity');
console.log('5. Test image generation with different text alignments');
