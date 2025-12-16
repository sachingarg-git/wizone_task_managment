import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist/public', // Output to main dist/public for Android build
    emptyOutDir: true,
    target: 'es2015', // Compatible with older Android WebView
    rollupOptions: {
      output: {
        format: 'iife', // Self-contained bundle for WebView
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks: undefined // Single bundle for mobile
      }
    },
    minify: 'esbuild',
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/assets': path.resolve(__dirname, './src/assets'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 8082,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  base: './', // Relative paths for mobile compatibility
})