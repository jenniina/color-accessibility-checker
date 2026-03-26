import { FormEvent, useEffect, useRef } from 'react'
import Accordion from '../Accordion/Accordion'
import { useSelector } from 'react-redux'
import { ReducerProps } from '../../types'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { initializeUser } from '../../reducers/authReducer'
import { Link } from 'react-router-dom'
import { useLanguageContext } from '../../contexts/LanguageContext'
import { useState } from 'react'
import { notify } from '../../reducers/notificationReducer'
import { getErrorMessage } from '../../utils'
import { createUser } from '../../reducers/usersReducer'

interface Props {
  setIsFormOpen?: (isFormOpen: boolean) => void
  text?: string
  isOpen?: boolean
}
const Register = ({ setIsFormOpen, isOpen, text }: Props) => {
  const { t } = useLanguageContext()

  const dispatch = useAppDispatch()

  const formRegisterRef = useRef<HTMLDivElement>(null)

  const user = useSelector((state: ReducerProps) => {
    return state.auth
  })

  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [sending, setSending] = useState(false)

  const handleRegister = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    setSending(true)
    if (password.trim() !== confirmPassword.trim()) {
      void dispatch(notify(t('PasswordsDoNotMatch'), true, 8))
      setSending(false)
      return
    }
    void dispatch(createUser({ name, username, password, language: 'en' }))
      .then((data) => {
        const message = data?.message || t('RegistrationSuccesful')
        void dispatch(notify(message, false, 8))
        setSending(false)
      })
      .catch((err: unknown) => {
        console.error(err)
        const message = getErrorMessage(err, t('Error'))
        void dispatch(notify(message, true, 8))
        setSending(false)
      })
  }

  useEffect(() => {
    void dispatch(initializeUser())
  }, [dispatch])

  return (
    <div className="register-wrap">
      {!user ? (
        <>
          <Accordion
            className={`accordion-register ${text}`}
            wrapperClass="register-wrap"
            text={t('Register')}
            ref={formRegisterRef}
            setIsFormOpen={setIsFormOpen}
            isOpen={isOpen}
            hideBrackets={true}
          >
            <>
              <h2>{t('Register')}</h2>
              <form onSubmit={handleRegister} className={`register`}>
                <p>{t('PleaseUseGoodTasteWhenChoosingYourNickname')}</p>
                <div className="input-wrap">
                  <label>
                    <input
                      required
                      type="text"
                      name="name"
                      id={`name-${text}`}
                      value={name}
                      autoComplete="name"
                      onChange={({ target }) => setName(target.value)}
                    />
                    <span>{t('Nickname')}</span>
                  </label>
                </div>
                <div className="input-wrap">
                  <label>
                    <input
                      required
                      type="text"
                      name="username"
                      id={`username-${text}`}
                      value={username}
                      autoComplete="email"
                      onChange={({ target }) =>
                        setUsername(target.value.trim())
                      }
                    />
                    <span>{t('Email')}</span>
                  </label>
                </div>
                <div className="input-wrap">
                  <label>
                    <input
                      required
                      type="password"
                      name="password"
                      id={`password-${text}`}
                      value={password}
                      autoComplete="on"
                      onChange={({ target }) =>
                        setPassword(target.value.trim())
                      }
                    />
                    <span>{t('Password')}</span>
                  </label>
                </div>
                <div className="input-wrap">
                  <label>
                    <input
                      required
                      type="password"
                      name="confirmPassword"
                      id={`confirmPassword-${text}`}
                      value={confirmPassword}
                      onChange={({ target }) =>
                        setConfirmPassword(target.value.trim())
                      }
                    />
                    <span>{t('ConfirmPassword')}</span>
                  </label>
                </div>
                <Link
                  to="/info"
                  style={{
                    display: 'flex',
                    flexFlow: 'row wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '1rem auto',
                  }}
                >
                  <small>{t('Disclaimer')}</small>
                </Link>
                <button
                  type="submit"
                  disabled={sending}
                  className={`restore ${text}`}
                >
                  {t('Register')}
                </button>
              </form>
            </>
          </Accordion>
        </>
      ) : (
        <></>
      )}
    </div>
  )
}

export default Register
