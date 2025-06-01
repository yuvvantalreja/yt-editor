import {defineConfig, UserConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'path';
import {execSync} from 'child_process';

const getCommitHash = () => {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (error) {
    return '';
  }
};

export default defineConfig(({command}) => {
  const config: UserConfig = {
    plugins: [react()],
    define: {
      'process.env.PARCEL_BUILD_COMMIT_HASH': JSON.stringify(getCommitHash()),
    },
    resolve: {
      alias: {},
    },
    server: {
      watch: {
        ignored: ['!**/node_modules/**', '!../**'],
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    publicDir: 'public',
    json: {
      stringify: true,
    },
    optimizeDeps: {
      include: ['vega', 'vega-lite', 'monaco-editor', 'react', 'react-dom'],
    },
  };

  if (command === 'build') {
    config.base = '/editor/';
  }

  return config;
});
