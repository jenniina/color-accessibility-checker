import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'
import { StaticRouter } from 'react-router-dom/server'
import type { HelmetServerState } from 'react-helmet-async'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { createAppStore } from './store'

export function render(url: string) {
  const store = createAppStore()
  const helmetContext: { helmet?: HelmetServerState } = {}
  const appHtml = renderToString(
    <Provider store={store}>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>
    </Provider>
  )

  const headTags = [
    helmetContext.helmet?.title?.toString() ?? '',
    helmetContext.helmet?.priority?.toString() ?? '',
    helmetContext.helmet?.meta?.toString() ?? '',
    helmetContext.helmet?.link?.toString() ?? '',
  ].join('')

  return { appHtml, headTags }
}
