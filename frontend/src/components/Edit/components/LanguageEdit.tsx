import { IUser, ELanguages, ELanguagesLong } from '../../../types'
import React, { useState } from 'react'
import { Select, SelectOption } from '../../Select/Select'
import { initializeUser, refreshUser } from '../../../reducers/authReducer'
import { useAppDispatch } from '../../../hooks/useAppDispatch'
import { notify } from '../../../reducers/notificationReducer'
import { findUserById, updateUser } from '../../../reducers/usersReducer'
import { getErrorMessage } from '../../../utils'
import styles from '../css/edit.module.css'
import { useLanguageContext } from '../../../contexts/LanguageContext'

interface Props {
  user: IUser
  options: (enumObj: typeof ELanguagesLong) => SelectOption[]
}
const LanguageEdit = ({ user, options }: Props) => {
  const dispatch = useAppDispatch()

  const [passwordOld, setPasswordOld] = useState<IUser['password']>('')

  const { t, language, setLanguage } = useLanguageContext()

  const [lang, setLang] = useState<ELanguages>(
    (user?.language as ELanguages) ?? language
  )

  const [sending, setSending] = useState(false)

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)
    const _id = user._id
    const editedUser = {
      _id,
      name: user.name,
      passwordOld,
      language: lang,
    }

    if (user) {
      await dispatch(updateUser(editedUser))
        .then(async (res) => {
          if (res) {
            if (res.success === false) {
              void dispatch(notify(`${t('Error')}: ${res.message}`, true, 5))
            } else {
              await dispatch(
                notify(`${res.message ?? t('UserUpdated')}`, false, 5)
              )
              await dispatch(refreshUser(res.user))
                .then(async () => {
                  await dispatch(findUserById(user?._id ?? ''))
                    .then(() => void dispatch(initializeUser()))
                    .catch(console.error)
                  setLanguage(lang)
                })
                .catch(console.error)
              setPasswordOld('')
            }
          }
          setSending(false)
        })
        .catch((err: unknown) => {
          console.error(err)
          const message = getErrorMessage(err, t('Error'))
          void dispatch(notify(message, true, 8))
          setSending(false)
        })
    }
  }

  return (
    <>
      {user ? (
        <>
          <h2>{t('EditLanguagePreference')}</h2>

          <form
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault()
              void handleUserSubmit(e).catch(console.error)
            }}
            className={styles['edit-user']}
          >
            <Select
              language={language}
              id="language-register"
              className={`language ${styles.language}`}
              instructions="Language"
              hide
              options={options(ELanguagesLong)}
              value={
                lang
                  ? ({
                      value: lang,
                      label: ELanguagesLong[lang],
                    } as SelectOption)
                  : undefined
              }
              onChange={(o) => {
                setLang(o?.value as ELanguages)
              }}
            />
            <div className="input-wrap">
              <label>
                <input
                  required
                  type="password"
                  name="old-password"
                  id="old-password-user-language"
                  value={passwordOld}
                  onChange={({ target }) => setPasswordOld(target.value.trim())}
                />
                <span>{t('CurrentPassword')}</span>
              </label>
            </div>
            <button type="submit" disabled={sending}>
              {t('Edit')}
            </button>
          </form>
        </>
      ) : (
        <></>
      )}
    </>
  )
}

export default LanguageEdit
