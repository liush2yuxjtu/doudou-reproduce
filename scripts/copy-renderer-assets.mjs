import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('dist/renderer', { recursive: true });
await copyFile('src/renderer/index.html', 'dist/renderer/index.html');
await copyFile('src/renderer/styles.css', 'dist/renderer/styles.css');
