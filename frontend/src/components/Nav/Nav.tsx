import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import styles from './nav.module.css'
import { useLanguageContext } from '../../contexts/LanguageContext'
import { ELanguages, ELanguagesLong } from '../../types'
import { Select, type SelectOption } from '../Select/Select'
import { useTheme, useThemeUpdate } from '../../hooks/useTheme'
import Icon from '../Icon/Icon'
import FormLogin from '../Login/Login'

import eye from '../../assets/eye2.svg'

function buildLanguageOptions(): SelectOption[] {
  return Object.values(ELanguages).map((lang) => ({
    value: lang,
    label: ELanguagesLong[lang] + ` (${lang.toUpperCase()})`,
  }))
}

export default function Nav() {
  const { t, language, setLanguage } = useLanguageContext()
  const lightTheme = useTheme()
  const toggleTheme = useThemeUpdate()

  const [settingsOpen, setSettingsOpen] = useState(false)

  const languageOptions = useMemo(() => buildLanguageOptions(), [])

  return (
    <header
      className={`${styles.navigation} ${lightTheme ? styles.light : styles.dark}`}
    >
      <div className={styles.inner}>
        <Link to="/" className={`${styles.logo} tooltip-wrap`}>
          <img src={eye} alt="logo" height="26" title={t('Logo')} />{' '}
          <span>Contrast at a Glance</span>
          <span className="scr">by Jenniina</span>
          <span className="tooltip below right narrow2" aria-hidden="true">
            by Jenniina
          </span>
        </Link>

        <div
          className={styles.settings}
          role="region"
          aria-label={t('Settings')}
        >
          <div className={`${styles['setting-item']} tooltip-wrap`}>
            <button
              type="button"
              className={`${styles['theme-btn']} ${lightTheme ? styles.light : styles.dark}`}
              onClick={() => toggleTheme?.()}
            >
              <span className={`${styles['theme-icon']}`} aria-hidden="true">
                <Icon lib="bs" name="BsFillMoonStarsFill" viewBox="0 0 17 17" />
                <Icon lib="bs" name="BsFillSunFill" />
              </span>
              <span className="scr">
                {lightTheme ? t('DarkMode') : t('LightMode')}
              </span>
            </button>
            <span aria-hidden="true" className="tooltip below left narrow2">
              {lightTheme ? t('DarkMode') : t('LightMode')}
            </span>
          </div>

          <div className={styles['setting-item']}>
            <Select
              language={language}
              id="language-navbar"
              className={`language ${styles.language} narrow2`}
              instructions={t('LanguageTitle')}
              hide
              hideDelete
              options={languageOptions}
              value={{
                value: language,
                label: `${ELanguagesLong[language]} (${language.toUpperCase()})`,
              }}
              onChange={(o) => {
                if (!o) return
                setLanguage(o.value as ELanguages)
              }}
              tooltip={true}
              x="left"
              y="below"
            />
          </div>

          <div className={`${styles['setting-item']} ${styles.auth}`}>
            <FormLogin
              text="nav"
              setIsFormOpen={setSettingsOpen}
              isOpen={settingsOpen}
              onClick={setSettingsOpen}
              below={true}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
