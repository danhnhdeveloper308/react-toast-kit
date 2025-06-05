import { defineConfig } from 'tsup';
import fs from 'fs/promises';
import { join } from 'path';

export default defineConfig({
  // Include devtools-entry as a separate entry point for better code splitting
  entry: ['src/index.ts', 'src/devtools-entry.ts'],
  format: ['cjs', 'esm'],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },
  dts: {
    resolve: true,
  },
  splitting: true, // Enable code splitting for better tree-shaking
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  external: ['react', 'react-dom', 'framer-motion'],
  noExternal: [],
  
  // Ensure CSS is properly handled as side effect
  banner: {
    js: '/* React Toast Kit - CSS auto-injection enabled */',
  },
  
  esbuildOptions(options) {
    // Mark React as external to prevent bundling issues
    options.external = [...(options.external || []), 'react', 'react-dom', 'react/jsx-runtime'];
    // Ensure JSX runtime is handled properly
    options.jsx = 'automatic';
    options.jsxImportSource = 'react';
  },
  
  onSuccess: async () => {
    try {
      console.log('🔧 Post-build CSS processing...');
      
      // Copy CSS file to dist with error handling
      const cssSourcePath = join(process.cwd(), 'src/index.css');
      const cssDistPath = join(process.cwd(), 'dist/styles.css');
      
      const cssContent = await fs.readFile(cssSourcePath, 'utf8');
      await fs.writeFile(cssDistPath, cssContent);
      console.log('✅ Created dist/styles.css');
      
      // Create CSS as JS module for better bundler support
      const cssAsJsContent = `// CSS as JS module for better bundler support
const css = ${JSON.stringify(cssContent)};

// Auto-inject CSS if in browser environment
if (typeof document !== 'undefined' && !document.getElementById('react-toast-kit-styles')) {
  const style = document.createElement('style');
  style.id = 'react-toast-kit-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

export default css;
`;
      
      await fs.writeFile(join(process.cwd(), 'dist/styles.js'), cssAsJsContent);
      console.log('✅ Created dist/styles.js');
      
      // Create TypeScript declaration for CSS module
      const cssTypesContent = `declare const css: string;
export default css;
`;
      await fs.writeFile(join(process.cwd(), 'dist/styles.d.ts'), cssTypesContent);
      console.log('✅ Created dist/styles.d.ts');
      
    } catch (error) {
      console.error('⚠️ Failed to process CSS files:', error);
      // Don't fail the build, just warn
    }
  },
});