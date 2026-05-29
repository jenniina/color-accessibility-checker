import {
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  useId,
} from 'react'
import { useLanguageContext } from '../../contexts/LanguageContext'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {
  unavailable?: boolean
  unavailableReason?: string
  tooltipClassName?: string
}

export default function ButtonUnavailableAction({
  unavailable = false,
  unavailableReason,
  tooltipClassName = 'tooltip right below narrow2',
  className = '',
  type = 'button',
  onClick,
  onKeyDown,
  'aria-describedby': ariaDescribedBy,
  children,
  ...props
}: Props) {
  const { t } = useLanguageContext()
  const reasonId = useId()
  const reasonText = unavailable && unavailableReason ? unavailableReason : ''
  const unavailableText = reasonText
    ? `${t('Unavailable')}: ${reasonText}`
    : t('Unavailable')
  const describedBy = [ariaDescribedBy, reasonText ? reasonId : undefined]
    .filter(Boolean)
    .join(' ')
  const nextType = unavailable && type === 'submit' ? 'button' : type

  const preventUnavailableAction = (
    event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>
  ) => {
    if (!unavailable) return false

    event.preventDefault()
    event.stopPropagation()
    return true
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (preventUnavailableAction(event)) return
    onClick?.(event)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (
      unavailable &&
      (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
    ) {
      preventUnavailableAction(event)
      return
    }

    onKeyDown?.(event)
  }

  return (
    <button
      {...props}
      type={nextType}
      className={`${className} tooltip-wrap ${
        unavailable ? 'unavailable-action' : ''
      }`.trim()}
      aria-disabled={unavailable}
      aria-describedby={describedBy || undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
      {reasonText ? (
        <>
          <span className={tooltipClassName} role="tooltip">
            {unavailableText}
          </span>
          <span id={reasonId} className="scr">
            {unavailableText}
          </span>
        </>
      ) : null}
    </button>
  )
}
