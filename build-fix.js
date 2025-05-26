#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Enhanced script to create framework-specific entry points with pure CSS
async function createFrameworkEntryPoints() {
    console.log('🔍 Starting React Toast Kit build process (Pure CSS)...');
    const distDir = path.join(process.cwd(), 'dist');
    
    console.log('📁 Checking dist directory structure...');
    if (!fs.existsSync(distDir)) {
        console.error('❌ Dist directory does not exist. Please run build first.');
        process.exit(1);
    }

    try {
        console.log('🔧 Creating framework-specific entry points...');
        
        // Get CSS content from source file
        const cssContent = getCssContent();
        
        // Create client entry points with CSS injection
        createClientEntryPoints(distDir, cssContent);
        
        // Update index files to include the CSS content directly
        updateIndexFiles(distDir, cssContent);
        
        // Create Next.js specific entry points
        createNextJSEntryPoints(distDir, cssContent);
        
        // Update package.json to include framework-specific exports
        updatePackageExports();
        
        console.log('🎉 Build process completed successfully!');
    } catch (error) {
        console.error('❌ Error creating framework entry points:', error);
        process.exit(1);
    }
}

// Get CSS content from source file
function getCssContent() {
    console.log('📝 Reading CSS content from source...');
    
    const sourceCssPath = path.join(process.cwd(), 'src', 'index.css');
    
    if (fs.existsSync(sourceCssPath)) {
        const cssContent = fs.readFileSync(sourceCssPath, 'utf8');
        console.log('✅ CSS content loaded from source');
        return cssContent;
    } else {
        console.warn('⚠️ Source CSS file not found, using fallback minimal CSS');
        return getMinimalCssContent();
    }
}

// Fallback minimal CSS if source file doesn't exist
function getMinimalCssContent() {
    return `/* React Toast Kit - Minimal CSS */
:root {
  --toast-z-index: 9999;
}

.react-toast-container {
  position: fixed;
  z-index: var(--toast-z-index);
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  width: 320px;
}

.react-toast-item {
  width: 100%;
  pointer-events: auto;
}

.react-toast {
  position: relative;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 16px;
  background: white;
  color: #333;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
}`;
}

// Create CSS injection code
function createCssInjectionCode(cssContent) {
    return `
// CSS auto-injection for React Toast Kit
(function() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('react-toast-kit-styles')) return;
  
  try {
    const style = document.createElement('style');
    style.id = 'react-toast-kit-styles';
    style.setAttribute('data-toast-kit-version', '1.0.5');
    style.textContent = ${JSON.stringify(cssContent)};
    
    // Insert at the beginning of head for proper CSS precedence
    if (document.head) {
      if (document.head.firstChild) {
        document.head.insertBefore(style, document.head.firstChild);
      } else {
        document.head.appendChild(style);
      }
    }
  } catch (e) {
    console.warn('[react-toast-kit] Could not auto-inject CSS:', e);
  }
})();
`;
}

// Create client entry points with CSS auto-injection
function createClientEntryPoints(distDir, cssContent) {
    console.log('🔧 Creating client entry points with CSS auto-injection...');
    
    const cssInjectionCode = createCssInjectionCode(cssContent);
    
    // Create client.mjs with CSS injection
    const clientMJSContent = `${cssInjectionCode}\nexport * from './index.mjs';\n`;
    fs.writeFileSync(path.join(distDir, 'client.mjs'), clientMJSContent);
    
    // Create client.cjs with CSS injection
    const clientCJSContent = `${cssInjectionCode}\nmodule.exports = require('./index.cjs');\n`;
    fs.writeFileSync(path.join(distDir, 'client.cjs'), clientCJSContent);
    
    console.log('✅ Created client entry points with CSS auto-injection');
}

// Update index files to include CSS content directly
function updateIndexFiles(distDir, cssContent) {
    console.log('📝 Updating index files to include CSS content...');
    
    try {
        // Update the injector code in index.mjs and index.cjs
        const mjsPath = path.join(distDir, 'index.mjs');
        const cjsPath = path.join(distDir, 'index.cjs');
        
        if (fs.existsSync(mjsPath)) {
            let mjsContent = fs.readFileSync(mjsPath, 'utf8');
            mjsContent = replaceInjectionPlaceholder(mjsContent, cssContent);
            fs.writeFileSync(mjsPath, mjsContent);
        }
        
        if (fs.existsSync(cjsPath)) {
            let cjsContent = fs.readFileSync(cjsPath, 'utf8');
            cjsContent = replaceInjectionPlaceholder(cjsContent, cssContent);
            fs.writeFileSync(cjsPath, cjsContent);
        }
        
        console.log('✅ Updated index files with actual CSS content');
    } catch (error) {
        console.warn('⚠️ Error updating index files:', error);
    }
}

// Replace CSS placeholder in compiled files
function replaceInjectionPlaceholder(content, cssContent) {
    // Replace the placeholder CSS comment with actual CSS content
    const placeholder = '/* CSS will be injected during build */';
    const cssStringified = JSON.stringify(cssContent);
    
    // Có thể có nhiều placeholder hoặc các format khác nhau, thử tìm và thay thế chúng
    let modifiedContent = content;
    
    if (content.includes(`"${placeholder}"`)) {
        modifiedContent = content.replace(`"${placeholder}"`, cssStringified);
    } else if (content.includes(`'${placeholder}'`)) {
        modifiedContent = content.replace(`'${placeholder}'`, cssStringified);
    } else if (content.includes(placeholder)) {
        modifiedContent = content.replace(placeholder, cssContent);
    }
    
    return modifiedContent;
}

// Create Next.js specific entry points
function createNextJSEntryPoints(distDir, cssContent) {
    console.log('🔧 Creating Next.js specific entry points...');
    const nextjsDir = path.join(distDir, 'nextjs');
    
    if (!fs.existsSync(nextjsDir)) {
        fs.mkdirSync(nextjsDir);
    }
    
    // Modify injection code for Next.js to use 'use client' directive
    const cssInjectionCode = `"use client";\n\n${createCssInjectionCode(cssContent)}`;
    
    // Create client.mjs - explicitly adding "use client" directive for Next.js users
    const nextClientContent = `${cssInjectionCode}\nexport * from '../index.mjs';\n`;
    fs.writeFileSync(path.join(nextjsDir, 'client.mjs'), nextClientContent);
    
    // Create client.cjs for CommonJS compatibility
    const nextClientCJSContent = `${cssInjectionCode}\nmodule.exports = require('../index.cjs');\n`;
    fs.writeFileSync(path.join(nextjsDir, 'client.cjs'), nextClientCJSContent);
    
    // Create server-safe file for Next.js
    const nextServerContent = `// Server-safe exports for Next.js
// This file only exports functions that are safe to use in Server Components

export { toast } from '../index.mjs';
// Types can be safely exported
export type { ToastOptions, ToastPosition, ToastVariant, ToastTheme, ToastAnimation, ToastStyle } from '../index.mjs';
`;
    fs.writeFileSync(path.join(nextjsDir, 'server.mjs'), nextServerContent);
    
    console.log('✅ Created Next.js specific entry points');
    
    // Create type definitions for NextJS
    createNextJSTypes(distDir, nextjsDir);
}

// Create type definitions for Next.js
function createNextJSTypes(distDir, nextjsDir) {
    console.log('📝 Adding Next.js type definitions...');
    const indexDtsPath = path.join(distDir, 'index.d.ts');
    
    if (fs.existsSync(indexDtsPath)) {
        // Create Next.js client types
        const nextjsClientDtsContent = `// NextJS client type definitions
export * from '../index';
`;
        fs.writeFileSync(path.join(nextjsDir, 'client.d.ts'), nextjsClientDtsContent);
        
        // Create Next.js server types - simplified to avoid potential type errors
        const nextjsServerDtsContent = `// NextJS server type definitions
export { toast } from '../index';
export type { 
  ToastOptions, 
  ToastPosition, 
  ToastVariant, 
  ToastTheme, 
  ToastAnimation, 
  ToastStyle 
} from '../index';
`;
        fs.writeFileSync(path.join(nextjsDir, 'server.d.ts'), nextjsServerDtsContent);
        
        console.log('✅ Added Next.js type definitions');
    } else {
        console.warn('⚠️ index.d.ts not found, skipping Next.js type definitions');
    }
}

// Update package.json to include framework-specific exports
function updatePackageExports() {
    console.log('📝 Updating package.json exports configuration...');
    
    try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Ensure sideEffects includes CSS files
        packageJson.sideEffects = [
            "*.css", 
            "./dist/styles.css", 
            "./dist/styles.js",
            "./dist/client.mjs", 
            "./dist/client.cjs",
            "./dist/nextjs/client.mjs",
            "./dist/nextjs/client.cjs"
        ];

        // Ensure we have the correct exports
        if (!packageJson.exports) {
            packageJson.exports = {};
        }

        // Ensure we have export for styles.css
        if (!packageJson.exports["./styles.css"]) {
            packageJson.exports["./styles.css"] = "./dist/styles.css";
        }
        
        console.log('✅ Updated package.json with CSS auto-injection support');
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } catch (error) {
        console.error('⚠️ Error updating package.json:', error);
    }
}

// Run script
createFrameworkEntryPoints().then(() => {
    console.log('✅ All done! CSS is now automatically bundled with the library.');
    console.log('📦 Users no longer need to import CSS separately.');
    console.log('🚀 Library is ready for publishing!');
}).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});