import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';
import { join } from 'path';

// Extract CSS from index.css to be included in the bundle
const css = readFileSync(join(__dirname, 'src/index.css'), 'utf8');

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  external: ['react', 'react-dom', 'framer-motion'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";', // Add 'use client' directive for Next.js App Router
    };
  },
  onSuccess: async () => {
    // Write the CSS to a separate file
    const fs = await import('fs/promises');
    await fs.writeFile(join(__dirname, 'dist/styles.css'), css);
    console.log('CSS file written to dist/styles.css');
  },
});