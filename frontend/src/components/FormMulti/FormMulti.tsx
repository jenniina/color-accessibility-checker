import { FormEvent, useState, useRef, useEffect } from 'react'
import Icon from '../Icon/Icon'
import { useMultistepForm } from './hooks/useMultistepForm'
import { ELanguages, RefObject } from '../../types'
import { FormData, INITIAL_DATA } from './types'
import styles from './form.module.css'
import { sendEmail } from './services/email'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { notify } from '../../reducers/notificationReducer'
import { useLanguageContext } from '../../contexts/LanguageContext'
import MessageForm from './components/MessageForm'
import ExtrasForm from './components/ExtrasForm'
import InitialForm from './components/InitialForm'

function FormMulti() {
  const { t, language } = useLanguageContext()

  const form = useRef() as RefObject<HTMLFormElement>

  const [data, setData] = useState(INITIAL_DATA)
  const [sending, setSending] = useState(false)

  const dispatch = useAppDispatch()

  function updateFields(fields: Partial<FormData>) {
    setData(prev => {
      return { ...prev, ...fields }
    })
  }
  const {
    steps,
    currentStepIndex,
    step,
    isFirstStep,
    isLastStep,
    back,
    next,
    goTo,
  } = useMultistepForm([
    <InitialForm {...data} updateFields={updateFields} key={`InitialForm`} />,
    <MessageForm {...data} updateFields={updateFields} key={`MessageForm`} />,
    <ExtrasForm {...data} updateFields={updateFields} key={`ExtrasForm`} />,
  ])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!isLastStep) return next()

    if (form.current) {
      try {
        setSending(true)
        await sendEmail(data).then(() => {
          setSending(false)
          goTo(0)
          setData(INITIAL_DATA)
          setShowMessage(true)
          setTimeout(() => {
            setShowMessage(false)
          }, 100000)
          void dispatch(notify(t('ThankYouForYourMessage'), false, 8))
        })
      } catch (error) {
        console.error('error', error)
        alert(t('ThereWasAnErrorSendingTheMessage'))
      }
    }
  }

  function handleNext() {
    if (
      /*first step with empty fields*/ isFirstStep &&
      (data.firstName == null ||
        data.firstName == '' ||
        data.lastName == null ||
        data.lastName == '')
    ) {
      setShowError(true)
      setTimeout(() => {
        setShowError(false)
      }, 3000)
    } else if (
      /*middle step with empty fields*/ !isFirstStep &&
      !isLastStep &&
      (data.email == null ||
        data.email.trim() == '' ||
        data.message == null ||
        data.message.trim() == '')
    ) {
      setShowError(true)
      setTimeout(() => {
        setShowError(false)
      }, 3000)
    } else {
      next()
    }
  }

  const [showError, setShowError] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const popup = useRef() as RefObject<HTMLDivElement>
  const nextButton = useRef() as RefObject<HTMLButtonElement>

  useEffect(() => {
    if (popup.current == null || nextButton.current == null) return
    popup.current.style.top = `-2em`
  }, [showError])

  return (
    <div className={styles.wrapper}>
      {language !== ELanguages.fi && language !== ELanguages.en && (
        <p>
          {t(
            'PleaseNoteThatTheAuthorJenniinaLaineSpeaksOnlyEnglishAndFinnishSo'
          )}
        </p>
      )}
      <form
        ref={form}
        onSubmit={e => void handleSubmit(e)}
        aria-labelledby="steps"
      >
        <span id="steps" className={styles.steps}>
          {t('ContactForm')} {t('Part')}&nbsp;
          <span>
            {currentStepIndex + 1}&nbsp;/&nbsp;{steps.length}
          </span>
        </span>
        <div className={styles.hiddenform}>
          {isLastStep ? (
            <>
              {' '}
              <InitialForm
                {...data}
                updateFields={updateFields}
                key={`InitialForm2`}
              />
              <MessageForm
                {...data}
                updateFields={updateFields}
                key={`MessageForm2`}
              />
            </>
          ) : (
            ''
          )}
        </div>

        {step}

        <div className={styles.btns} style={{ position: 'relative' }}>
          {!isFirstStep && (
            <button type="button" onClick={back}>
              <span aria-hidden="true">«</span> {t('Back')}
            </button>
          )}
          {!isLastStep && (
            <button
              ref={nextButton}
              type="button"
              className={isLastStep ? styles.submit : styles.next}
              onClick={handleNext}
            >
              {sending ? t('SendingEmail') : t('Next')}{' '}
              <span aria-hidden="true">»</span>
            </button>
          )}
          {isLastStep && (
            <button
              className={isLastStep ? styles.submit : styles.next}
              type="submit"
              disabled={sending}
            >
              {sending ? t('SendingEmail') : t('Send')}{' '}
              <Icon lib="ri" name="RiMailSendLine" />
            </button>
          )}
          {showError && (
            <div
              ref={popup}
              aria-live="assertive"
              style={{
                position: 'absolute',
                fontWeight: 'bold',
                color: 'inherit',
                letterSpacing: '0.04em',
              }}
            >
              {t('PleaseFillInTheFields')}
            </div>
          )}
          {showMessage && (
            <div
              ref={popup}
              aria-live="polite"
              style={{
                position: 'absolute',
                top: '-1.4em',
                fontWeight: 'bold',
                color: 'inherit',
                letterSpacing: '0.04em',
              }}
            >
              {t('ThankYouForYourMessage')}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

export default FormMulti
