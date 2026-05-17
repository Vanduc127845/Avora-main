import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  loadEnv(mode, path.resolve(__dirname, '../../'), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@ai4a/shared': path.resolve(__dirname, '../../packages/shared/src'),
      },
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/index-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-native') || id.includes('expo')) {
                return 'native-compat';
              }
              if (id.includes('lucide-react')) {
                return 'icons';
              }
              if (id.includes('framer-motion')) {
                return 'motion';
              }
              if (id.includes('@supabase')) {
                return 'supabase';
              }
              if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
                return 'forms';
              }
              if (id.includes('i18next') || id.includes('date-fns')) {
                return 'intl';
              }
              if (id.includes('@tanstack')) {
                return 'ai';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
