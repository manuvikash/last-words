import esbuild from 'esbuild';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const handlers = await glob('src/handlers/**/*.ts', { cwd: __dirname });

const builds = handlers.map((handler) => {
  const parsed = path.parse(handler);
  const dir = path.relative('src/handlers', parsed.dir);
  const outDir = path.join('dist', dir);

  return esbuild.build({
    entryPoints: [handler],
    bundle: true,
    minify: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: path.join(outDir, `${parsed.name}.mjs`),
    external: ['@aws-sdk/*'],
    banner: {
      js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
    },
  });
});

await Promise.all(builds);
console.log(`✓ Built ${handlers.length} handlers`);
