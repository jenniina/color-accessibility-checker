import { useEffect, useState } from 'react'
import { useAppSelector } from '../../hooks/useAppSelector'
import { useLanguageContext } from '../../contexts/LanguageContext'

export default function Notification() {
  const { t } = useLanguageContext()

  const notification = useAppSelector((state) => state.notification ?? null)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    setClosed(false)
  }, [notification])

  if (notification === null || closed) {
    return null
  }

  return (
    <div
      className={`notification ${notification.isError ? 'error' : ''}`}
      aria-live="assertive"
    >
      <p>
        {notification.message}{' '}
        <button
          type="button"
          className="close"
          onClick={() => {
            setClosed(true)
          }}
        >
          <span>{t('Close')}</span>
          <span aria-hidden="true" className="times">
            &times;
          </span>
        </button>
      </p>
    </div>
  )
}
