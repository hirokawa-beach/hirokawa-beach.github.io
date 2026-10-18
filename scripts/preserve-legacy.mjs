import { cpSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
mkdirSync('dist', { recursive: true });
for (const directory of ['studycopi-guide', 'img']) {
  if (existsSync(directory)) cpSync(directory, join('dist', directory), { recursive: true, force: true });
}
if (existsSync('feed.xml')) copyFileSync('feed.xml', 'dist/feed.xml');
