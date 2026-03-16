import { ReactNode } from 'react'

interface FormWrapperProps {
  title: string
  description: string
  children: ReactNode
}

export default function FormWrapper({
  title,
  description,
  children,
}: FormWrapperProps) {
  return (
    <>
      <fieldset>
        <legend>
          {' '}
          {title}
          <p> {description} </p>
        </legend>
        {children}
      </fieldset>
    </>
  )
}
