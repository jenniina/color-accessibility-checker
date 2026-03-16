import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useScrollbarWidth } from './hooks/useScrollbarWidth'
import { useTheme } from './hooks/useTheme'
import { useLanguageContext } from './contexts/LanguageContext'
import AccessibleColors from './components/AccessibleColors/AccessibleColors'
import Notification from './components/Notification/Notification'
import Disclaimer from './components/Disclaimer/Disclaimer'
import Contact from './components/Contact/Contact'
import UserEditPage from './components/Edit/UserEditPage'
import { ELanguages, ELanguagesLong } from './types'
import type { SelectOption } from './components/Select/Select'
import Footer from './components/Footer/Footer'
import Nav from './components/Nav/Nav'
import './css/index.css'
import './css/form.css'

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ConfirmProvider>
            <AppShell />
          </ConfirmProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}

function AppShell() {
  const { language } = useLanguageContext()
  const lightTheme = useTheme()
  const scrollbarWidth = useScrollbarWidth()

  const languageOptions = (enumObj: typeof ELanguagesLong): SelectOption[] => {
    return Object.values(ELanguages).map((lang) => ({
      value: lang,
      label: enumObj[lang],
    }))
  }

  const styleWrap: React.CSSProperties = {
    ['--scrollbar_width' as string]: `${scrollbarWidth}px`,
  }

  return (
    <div
      style={styleWrap}
      className={`App ${lightTheme ? 'light' : ''} transformations ${language}`}
    >
      <div className="App-inner-wrap">
        <Nav />
        <main id="main-content" className="main-content" role="main">
          <Routes>
            <Route path="/" element={<AccessibleColors />} />
            <Route path="/contact" element={<Contact type="page" />} />
            <Route path="/info" element={<Disclaimer type="page" />} />
            <Route
              path="/edit"
              element={<UserEditPage type="page" options={languageOptions} />}
            />
            <Route path="*" element={<AccessibleColors />} />
          </Routes>
        </main>
        <Footer />
        <Notification />
      </div>
    </div>
  )
}
