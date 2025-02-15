import esbuild from 'esbuild';
import { rm, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';

import generateObsidianPluginManifest from "./src/utils/manifest.js";

async function toErrorable(fn) {
  try {
    await fn();
  } catch (error) {
    console.error('[Error]', error);
  }
}

const buildHooks = {
  'build:before': async () => {
    await toErrorable(() => rm(join(cwd(), 'main.js')));
    await toErrorable(() => rm(join(cwd(), 'manifest.json')));
  },
  'build:done': async () => {
    await generateObsidianPluginManifest();
    await copyFile(join(cwd(), 'dist', 'main.js'), join(cwd(), 'main.js'));
    await copyFile(join(cwd(), 'dist', 'manifest.json'), join(cwd(), 'manifest.json'));
  },
};

const isProduction = process.argv.includes('production');

(async () => {
  await buildHooks['build:before']();

  try {
    await esbuild.build({
      entryPoints: ['./src/main.ts'],
      bundle: true,
      platform: 'node',
      outdir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction,
      target: 'es2020',
      external: [
        'obsidian'
      ]
    });
    console.log('Build completed successfully.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }

  await buildHooks['build:done']();
})();