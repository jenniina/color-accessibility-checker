import { useEffect, useState, FormEvent, useRef } from 'react'
import Accordion from '../Accordion/Accordion'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { notify } from '../../reducers/notificationReducer'
import { initializeUser, login, logout } from '../../reducers/authReducer'
import { useSelector } from 'react-redux'
import { ReducerProps } from '../../types'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguageContext } from '../../contexts/LanguageContext'
import { getErrorMessage } from '../../utils'
import Icon from '../Icon/Icon'
import Register from '../Register/Register'
import CopyToClipboard from '../CopyToClipboard/CopyToClipboard'
import PasswordReset from '../PasswordReset/PasswordReset'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import ButtonUnavailableAction from '../ButtonUnavailableAction/ButtonUnavailableAction'

interface LoginProps {
  setIsFormOpen?: (isFormOpen: boolean) => void
  isOpen?: boolean
  text?: string
  below?: boolean
  showIcon?: boolean
}
const OtherSites = () => {
  const { t } = useLanguageContext()
  return (
    <div className="mt1">
      <span>{t('YouMayLogInToTheseSitesWithTheSameCredentials')}:</span>
      <ul className="ul">
        <li>
          <a className="tooltip-wrap" href="https://blobs.jenniina.fi">
            {t('BlobArtApp')}
            <span className="tooltip narrow2 right above">
              {t('BlobAppIntro')}
            </span>
          </a>
        </li>
        <li>
          <a className="tooltip-wrap" href="https://jokes.jenniina.fi">
            {t('TheComediansCompanion')}
            <span className="tooltip narrow2 right above">
              {t('JokeAppWithCustomizableOptions')}.{' '}
              {t('YouMaySaveYourFavoriteJokesOrAddYourOwn')}
            </span>
          </a>
        </li>
        <li>
          <a className="tooltip-wrap" href="https://react.jenniina.fi">
            {t('JenniinasReactPortfolio')}
            <span className="tooltip narrow2 right above">
              {t('PortfolioIntro')}
            </span>
          </a>
        </li>
      </ul>
    </div>
  )
}

const FormLogin = ({
  setIsFormOpen,
  isOpen,
  text,
  below,
  showIcon = false,
}: LoginProps) => {
  const { t, language } = useLanguageContext()

  const location = useLocation()
  const navigate = useNavigate()

  const dispatch = useAppDispatch()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const loginReason = loggingIn ? t('LoggingIn') : ''

  const closeRef = useRef<HTMLDivElement>(null)

  const user = useSelector((state: ReducerProps) => {
    return state.auth?.user
  })

  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    void dispatch(initializeUser())
  }, [dispatch])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const loginParam = params.get('login')
    const isNavTarget = loginParam === 'nav'
    const isGenericTarget = loginParam === 'true'

    // If the URL targets the Nav explicitly, only the Nav instance should react.
    // (Nav passes text="nav"; other instances like NamedPalettes do not.)
    if (isNavTarget && text !== 'nav') return

    const shouldOpen = isNavTarget || isGenericTarget
    if (!shouldOpen) return

    // One-shot trigger: open login (if possible) then remove the query param.
    if (!user) {
      setIsFormOpen?.(true)
    }

    params.delete('login')
    const nextSearch = params.toString()
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true }
    )
  }, [location.pathname, location.search, navigate, setIsFormOpen, user, text])

  const handleLogout = () => {
    void dispatch(logout())
      .then(() => {
        void dispatch(notify(`${t('LoggedOut')}`, false, 4))
      })
      .catch((err: unknown) => {
        const message = getErrorMessage(err, t('Error'))
        console.error(err)
        void dispatch(notify(`${t('Error')}: ${message}`, true, 8))
      })
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    void dispatch(notify(`${t('LoggingIn')}`, false, 3))
    setLoggingIn(true)
    await dispatch(login(username, password, language))
      .then(() => {
        setLoggingIn(false)
        setUsername('')
        setPassword('')
        setIsFormOpen?.(false)
        void dispatch(notify(`${t('LoggedInAs')} ${username}`, false, 4))
      })
      .catch((err: unknown) => {
        setLoggingIn(false)
        console.error(err)
        const message = getErrorMessage(err, t('Error'))
        void dispatch(notify(message, true, 8))
      })
  }

  useOutsideClick({
    ref: closeRef,
    onOutsideClick: () => {
      setIsFormOpen?.(false)
      setRegisterOpen(false)
      setResetOpen(false)
      setMenuOpen(false)
    },
  })

  return (
    <>
      {user ? (
        <div ref={closeRef} className="logout-wrap">
          <button
            type="button"
            className="tooltip-wrap user-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <Icon
              lib="io5"
              name="IoPerson"
              className="person"
              style={{ fontSize: '1.3rem' }}
            />
            <span className="scr">{t('UserMenu')}</span>
            <span className="tooltip left below narrow2" aria-hidden="true">
              {t('UserMenu')}
            </span>
          </button>

          {menuOpen && (
            <div className="user-menu">
              <span>
                {t('LoggedInAs')} <i>{user?.name ?? user.username}</i>
              </span>
              <Link to="/edit">{t('Edit')}</Link>
              <button
                onClick={handleLogout}
                id={`logout-${text}`}
                className={`logout danger ${text}`}
              >
                {t('Logout')} &times;
              </button>
              <OtherSites />
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            ref={closeRef}
            className="flex column center gap-half login-icon-wrap"
          >
            {showIcon && !isOpen && (
              <button
                type="button"
                className="reset p1"
                style={{ fontSize: '1rem', borderRadius: '50%' }}
                onClick={() => setIsFormOpen?.(!isOpen)}
              >
                <Icon
                  lib="bi"
                  name="BiLogInCircle"
                  style={{
                    fontSize: '2.6rem',
                    margin: '0 auto',
                    display: 'flex',
                  }}
                  aria-hidden="true"
                />
                <span className="scr">{t('Login')}</span>
              </button>
            )}
            <Accordion
              id="login"
              showButton={true}
              className={`login ${text ?? ''}`}
              wrapperClass={`login-wrap  ${below ? 'child-absolute right' : 'above'}`}
              text={
                <>
                  <span>{t('Login')}</span>
                  <Icon
                    lib="bi"
                    name="BiLogInCircle"
                    style={{
                      fontSize: '1.2rem',
                      padding: '0',
                    }}
                  />
                </>
              }
              tooltip={t('LogInToSaveColorPalettesToDatabase')}
              y="below"
              x="left"
              setIsFormOpen={setIsFormOpen}
              isOpen={isOpen}
              hideBrackets={true}
            >
              <>
                <h2>{t('Login')}</h2>

                <form
                  onSubmit={(event) => void handleLogin(event)}
                  className="login"
                >
                  <div className="input-wrap">
                    <label>
                      <input
                        name="username"
                        type="text"
                        value={username}
                        required
                        autoComplete="email"
                        onChange={({ target }) =>
                          setUsername(target.value.trim())
                        }
                      />
                      <span>{t('Email')}: </span>
                    </label>
                  </div>
                  <div className="input-wrap">
                    <label>
                      <input
                        name="password"
                        type="password"
                        required
                        value={password}
                        autoComplete="on"
                        onChange={({ target }) =>
                          setPassword(target.value.trim())
                        }
                      />
                      <span>{t('Password')}: </span>
                    </label>
                  </div>
                  <ButtonUnavailableAction
                    type="submit"
                    unavailable={Boolean(loginReason)}
                    unavailableReason={loginReason}
                    id={`login-${text}`}
                    className={`login ${text} restore`}
                  >
                    {loggingIn ? t('LoggingIn') : t('Login')}
                  </ButtonUnavailableAction>
                </form>

                <Register
                  isOpen={registerOpen}
                  setIsFormOpen={setRegisterOpen}
                  text="reg"
                />

                <Accordion
                  className="password-reset"
                  wrapperClass="password-reset-wrap"
                  text={`${t('ForgotPassword')}`}
                  hideBrackets={true}
                  setIsFormOpen={setResetOpen}
                  isOpen={resetOpen}
                >
                  <PasswordReset text="login" />
                </Accordion>

                <div className="mt3 flex column gap-half left">
                  <span>{t('IfYouDontWantToRegister')} </span>
                  <div className="flex align-center column gap-half left">
                    <CopyToClipboard
                      value={`temp${String.fromCharCode(64)}jenniina.fi`}
                      label="temp <at> jenniina <dot> fi"
                      ariaLabel={t('CopyToClipboard')}
                      className="m0"
                    />
                    <div className="flex column gap-half left mt1">
                      {t('Password')}:{' '}
                      <CopyToClipboard
                        value="TempAtJenniina"
                        label="TempAtJenniina"
                        ariaLabel={t('CopyToClipboard')}
                        className="m0"
                      />
                    </div>
                  </div>
                </div>
                <OtherSites />
              </>
            </Accordion>
          </div>
        </>
      )}
    </>
  )
}

export default FormLogin
