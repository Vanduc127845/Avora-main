import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: [resolve(__dirname, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outdir: 'dist',
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
