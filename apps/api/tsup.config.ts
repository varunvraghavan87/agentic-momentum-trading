import { defineConfig } from 'tsup';
import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import type { Plugin } from 'esbuild';

/**
 * esbuild plugin that resolves .js imports to .ts source files.
 *
 * TypeScript's "moduleResolution": "NodeNext" convention requires writing
 * `.js` extensions in imports even when the source files are `.ts`.
 * esbuild doesn't handle this natively — it looks for a literal `.js` file
 * and fails when only a `.ts` file exists. This plugin intercepts those
 * imports and rewrites them to the actual `.ts` path.
 */
const resolveTypescriptPaths: Plugin = {
  name: 'resolve-typescript-paths',
  setup(build) {
    build.onResolve({ filter: /\.js$/ }, (args) => {
      // Only handle relative imports (./foo.js or ../foo.js)
      if (!args.path.startsWith('.')) return undefined;

      const tsPath = args.path.replace(/\.js$/, '.ts');
      const resolvedDir = args.resolveDir;
      const fullPath = resolve(resolvedDir, tsPath);

      if (existsSync(fullPath)) {
        return { path: fullPath };
      }

      return undefined;
    });
  },
};

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  esbuildPlugins: [resolveTypescriptPaths],
  noExternal: ['@amt/shared'],
});
