import { useTheme } from '../../hooks/useTheme'
import { useLanguageContext } from '../../contexts/LanguageContext'
import styles from './heading.module.css'
import { useSelector } from 'react-redux'
import { ReducerProps } from '../../types'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { useCallback, useRef, useState } from 'react'
import Accordion from '../Accordion/Accordion'
import { firstToLowerCase } from '../../utils'
import CopyToClipboard from '../CopyToClipboard/CopyToClipboard'
import { Link, useLocation as useRouterLocation } from 'react-router-dom'
import Icon from '../Icon/Icon'

export default function Header({
  title,
  subtitle,
  location,
}: {
  title: string
  subtitle?: string
  location?: string
}) {
  const user = useSelector((state: ReducerProps) => {
    return state.auth?.user
  })
  const lightTheme = useTheme()
  const { t } = useLanguageContext()
  const routerLocation = useRouterLocation()

  const resolvedTitle = title ?? t('ColorAccessibility') + ' ' + t('WCAGTool')

  const [hintsOpen, setHintsOpen] = useState(false)

  const instructionsRef = useRef<HTMLDivElement | null>(null)

  const handleOutsideClick = useCallback(() => {
    setHintsOpen(false)
  }, [])

  useOutsideClick({
    ref: instructionsRef,
    onOutsideClick: handleOutsideClick,
  })

  return (
    <div className={`${styles.header} ${lightTheme ? styles.light : ''}`}>
      <div className={styles.full}>
        <div className={styles.inner}>
          <h1 className={styles.title}>{resolvedTitle}</h1>
          <div
            id="instructions"
            className={styles.instructions}
            ref={instructionsRef}
          >
            {subtitle ? (
              <span className={styles.tagline}>{subtitle}</span>
            ) : null}
            {location === 'colors' && (
              <Accordion
                text={
                  <div className="flex center">
                    <Icon
                      lib="ri"
                      name="RiQuestionLine"
                      viewBox="0 0 24 24"
                      style={{ fontSize: '1.2em' }}
                    />
                    <span className="scr">{t('Hints')}</span>
                  </div>
                }
                className={`${hintsOpen ? styles.open : styles.closed}`}
                wrapperClass={`${styles['hints-wrapper']} tooltip-wrap`}
                isOpen={hintsOpen}
                setIsFormOpen={setHintsOpen}
                hideBrackets={true}
              >
                <ul className={`ul medium ${styles['hints-list']}`}>
                  <li>{t('ColorsCanBeReorderedByDragging')}</li>
                  <li>{t('HintOrganizingColors')}</li>
                  <li>
                    {t('SaveSVG')} (
                    {firstToLowerCase(t('WithOrWithoutColorName'))})
                  </li>
                  <li>
                    {t('SavePNG')} (
                    {firstToLowerCase(t('WithOrWithoutColorName'))})
                  </li>
                  <li>
                    {t('ChangingTheSizeWillAlsoChangeTheSizeOfTheSavedFile')}
                  </li>
                  <li>{t('LogInToSaveColorPalettesToDatabase')}</li>
                  {!user && (
                    <li>
                      {t('IfYouDontWantToRegister')}{' '}
                      <div className="flex column mt1 gap-half left">
                        <CopyToClipboard
                          value={`temp${String.fromCharCode(64)}jenniina.fi`}
                          label="temp [at] jenniina [dot] fi"
                          ariaLabel={t('CopyToClipboard')}
                        />
                        {t('Password')}:{' '}
                        <CopyToClipboard
                          value="TempAtJenniina"
                          label="TempAtJenniina"
                          ariaLabel={t('CopyToClipboard')}
                        />
                      </div>{' '}
                      <div className="flex column mt1">
                        <Link
                          replace
                          to={`?${(() => {
                            const next = new URLSearchParams(
                              routerLocation.search
                            )
                            next.set('login', 'nav')
                            return next.toString()
                          })()}`}
                        >
                          {t('Login')}
                        </Link>
                      </div>
                    </li>
                  )}
                </ul>
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
