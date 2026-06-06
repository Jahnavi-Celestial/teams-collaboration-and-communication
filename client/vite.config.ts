import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@apollo/client',
    '@mui/material',
    '@mui/icons-material',
    '@emotion/react',
    '@emotion/styled'
  ]},
  build: {
    sourcemap: false,

    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'CIRCULAR_DEPENDENCY') {
          return;
        }
        warn(warning);
      },
      external: []
    },
    
    minify: 'esbuild',
    target: 'es2022'
  }
})
