import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';

import packageJSON from '../../package.json' assert { type: 'json' };

export default async function generateObsidianPluginManifest() {
  const manifest = {
    id: 'phanford-obsidian-publish',
    name: 'Phanford Obsidian Publish',
    version: packageJSON.version,
    minAppVersion: '1.4.0',
    description: 'Phanford Obsidian Publish',
    author: 'CodeSpent',
    authorUrl: 'https://github.com/CodeSpent',
    isDesktopOnly: false,
  };

  await writeFile(join(cwd(), 'dist', 'manifest.json'), JSON.stringify(manifest, null, 2));
}