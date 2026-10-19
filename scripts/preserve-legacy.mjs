import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
mkdirSync('dist', { recursive: true });
for (const directory of ['studycopi-guide', 'img']) {
  if (existsSync(directory)) cpSync(directory, join('dist', directory), { recursive: true, force: true });
}
