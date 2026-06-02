import * as esbuild from 'esbuild';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outdir = resolve(__dirname, 'dist');

const isWatch = process.argv.includes('--watch');

if (dirname(outdir) !== __dirname) {
  throw new Error(`Refusing to clean unexpected build output directory: ${outdir}`);
}

await rm(outdir, { recursive: true, force: true });

const buildOptions = {
  entryPoints: [{ in: resolve(__dirname, 'src/server.ts'), out: 'index' }],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outdir,
  format: 'esm',
  sourcemap: true,
  banner: {
    js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
  },
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build({
    ...buildOptions,
    minify: false,
  });
  console.log('Build complete!');
}
