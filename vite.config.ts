import react from '@vitejs/plugin-react'
import path, { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // root: 'dev', // for dev only
  define: {
    'process.env': JSON.stringify({ NODE_ENV: 'production' }),
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './externals/components'),
      '@modules': path.resolve(__dirname, './externals/modules'),
      '@api': path.resolve(__dirname, './externals/api'),
      '@hooks': path.resolve(__dirname, './externals/hooks'),
      '@services': path.resolve(__dirname, './externals/services'),
      '@utils': path.resolve(__dirname, './externals/utils'),
      '@styles': resolve(__dirname, 'externals/styles'),
      types: resolve(__dirname, 'externals/types'),
    },
  },
  server: {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
    },
  },
  build: {
    minify: false,
    lib: {
      entry: path.resolve(__dirname, 'src/sandbox-component.tsx'),
      name: 'SandboxComponent',
      fileName: 'sandbox-component',
      formats: ['iife'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    watch: {},
  },
})
