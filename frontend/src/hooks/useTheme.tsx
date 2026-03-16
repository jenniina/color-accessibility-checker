import { useContext } from 'react'
import { ThemeUpdateContext, ThemeContext } from '../contexts/ThemeContext'

export function useTheme() {
  return useContext(ThemeContext)
}

export function useThemeUpdate() {
  return useContext(ThemeUpdateContext)
}
