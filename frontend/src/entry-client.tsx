import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { createAppStore } from './store'

const store = createAppStore()

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container (#root) not found')
}

const app = (
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </Provider>
  </React.StrictMode>
)

// When running through the SSR server, #root contains server-rendered *elements*.
// When running the frontend standalone (e.g. Vite dev on :5173), it only contains
// the placeholder comment `<!--app-html-->` which must NOT be hydrated.
if (container.firstElementChild) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
