import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: {
      "*": resolve(__dirname, './src/*'),
    },
  },
  plugins: [
    react(),
    tsConfigPaths(),
    dts({ include: ['src/App.tsx'] }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/App.tsx'),
      name: '@netherite/core',
      fileName: 'App'
    },
    rollupOptions: {
      external: [
        '@apollo/client',
        'graphql',
        'react',
        'react-dom',
      ],
      output: {
        exports: 'named',
        globals: {
          react: 'React'
        }
      }
    }
  }
});
