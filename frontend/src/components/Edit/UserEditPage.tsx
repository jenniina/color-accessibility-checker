import React, { useEffect, useState } from 'react'
import Icon from '../Icon/Icon'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { ELanguagesLong } from '../../types'
import styles from './css/useredit.module.css'
import { SelectOption } from '../Select/Select'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { ReducerProps } from '../../types'
import { initializeUser, logout } from '../../reducers/authReducer'
import { removeUser } from '../../reducers/usersReducer'
import { notify } from '../../reducers/notificationReducer'
import { useLanguageContext } from '../../contexts/LanguageContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import SEO from '../SEO/SEO'
import PasswordEdit from './components/PasswordEdit'
import UsernameEdit from './components/UsernameEdit'
import LanguageEdit from './components/LanguageEdit'
import NicknameEdit from './components/NicknameEdit'

interface Props {
  type: string
  options: (enumObj: typeof ELanguagesLong) => SelectOption[]
}

const UserEditPage = ({ type, options }: Props) => {
  const { t } = useLanguageContext()
  const confirm = useConfirm()

  const lightTheme = useTheme()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)

  const user = useSelector((state: ReducerProps) => {
    return state.auth?.user
  })

  useEffect(() => {
    void dispatch(initializeUser()).catch(console.error)
  }, [dispatch])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        navigate('/')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [user, navigate])

  const handleUserRemove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)
    if (user) {
      if (
        await confirm({
          message: `${t('AreYouSureYouWantToDelete')} ${user.username}?`,
        })
      ) {
        if (
          await confirm({
            message: `${t('YouWillLoseAllTheDataAssociatedWithIt')}`,
          })
        ) {
          await dispatch(removeUser(user._id, false)).then(async () => {
            await dispatch(logout())
            navigate('/')
            void dispatch(notify(t('AccountDeleted'), false, 8))
            setSending(false)
          })
        } else {
          setSending(false)
        }
      } else {
        setSending(false)
      }
    } else {
      setSending(false)
    }
  }

  return (
    <>
      <SEO
        title={`${t('Edit')} | colors.jenniina.fi`}
        description={t('Edit')}
        canonicalUrl={'https://colors.jenniina.fi/edit'}
      />
      <div className={`edit ${type} ${lightTheme ? styles.light : ''}`}>
        <div className="inner-wrap">
          <section className={`card`}>
            <div>
              <div className={styles.editform}>
                <NicknameEdit user={user} />
              </div>
              <div className={styles.editform}>
                <UsernameEdit user={user} />
              </div>
              <div className={styles.editform}>
                <LanguageEdit user={user} options={options} />
              </div>
              <div className={styles.editform}>
                <PasswordEdit user={user} />
              </div>
              {user ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void handleUserRemove(e)
                  }}
                  className="flex center"
                >
                  <button
                    type="submit"
                    disabled={sending || user.name === 'temp'}
                    className={`submit danger ${styles['delete-account']} ${styles.submit}`}
                  >
                    <Icon lib="ti" name="TiDeleteOutline" />{' '}
                    {t('DeleteAccount')}
                  </button>
                </form>
              ) : (
                ''
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

export default UserEditPage
