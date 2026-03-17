import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Desired deploy layout:
// - backend server build: ../backend/dist/** (via tsc)
// - client build: ../backend/dist/frontend/** (index.html + assets/)
// - SSR bundle: ../backend/dist/ssr/** (entry-server.js)
export default defineConfig(({ isSsrBuild }) => {
  const outDir = isSsrBuild
    ? path.resolve(__dirname, '../backend/dist/ssr')
    : path.resolve(__dirname, '../backend/dist/frontend')

  return {
    plugins: [react()],
    // Monorepo note: the backend and frontend both have node_modules.
    // Without dedupe, Vite (especially in SSR middleware mode) can resolve
    // multiple copies of React, which triggers "Invalid hook call" errors.
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-redux',
        'react-router',
        'react-router-dom',
        'react-helmet-async',
      ],
    },
    // Ensure React (and the dev JSX runtime) are prebundled to ESM in dev.
    // This avoids SSR dev evaluating raw CJS wrappers like react/jsx-dev-runtime.
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-redux',
        'react-router',
        'react-router-dom',
        'react-helmet-async',
      ],
    },
    ssr: {
      // Needed for production SSR on Node ESM (Cloud Run):
      // `react-helmet-async` is CommonJS and will crash if left externalized
      // and imported with named exports in the SSR bundle.
      noExternal: ['react-helmet-async'],
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-redux',
          'react-router',
          'react-router-dom',
          'react-helmet-async',
        ],
      },
    },
    build: {
      outDir,
      emptyOutDir: isSsrBuild ? false : true,
      manifest: isSsrBuild ? false : true,
    },
    server: {
      host: true,
    },
  }
})
