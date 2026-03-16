import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import copy from 'rollup-plugin-copy'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      ...copy({
        targets: [
          {
            src: 'routes.json',
            dest: resolve(__dirname, '../backend/dist/frontend'),
          },
        ],
        hook: 'writeBundle', // run the plugin after all the files are bundled and written to disk
        copyOnce: true,
      }),
      enforce: 'post', // run the plugin after all the other plugins
    },
  ],
  server: {
    host: true,
  },
  base: '/',

  build: {
    outDir: resolve(__dirname, '../backend/dist/frontend'),
    minify: 'terser',
    sourcemap: true,
    target: 'es2015',
    rollupOptions: {
      external: [],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    emptyOutDir: true,
  },
  ssr: {
    noExternal: command === 'build' ? true : ['react-helmet-async'],
  },
}))
