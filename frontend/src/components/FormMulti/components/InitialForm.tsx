import FormWrapper from './FormWrapper'
import { useLanguageContext } from '../../../contexts/LanguageContext'

interface UserData {
  firstName: string
  lastName: string
}

type UserFormProps = UserData & {
  updateFields: (fields: Partial<UserData>) => void
}

export default function InitialForm({
  firstName,
  lastName,
  updateFields,
}: UserFormProps) {
  const { t } = useLanguageContext()

  return (
    <FormWrapper
      title={t('BasicDetails')}
      description={t('ThisContactFormIsSplitIntoThreeSteps')}
    >
      <div className="input-wrap">
        <label>
          <input
            // autoFocus
            required
            type="text"
            name="firstname"
            value={firstName}
            onChange={e => updateFields({ firstName: e.target.value })}
          />
          <span>
            {t('FirstName')}{' '}
            <i className="required" aria-hidden="true">
              *
            </i>
          </span>
        </label>
      </div>
      <div className="input-wrap">
        <label className="drop">
          <input
            id="form-last-name"
            required
            type="text"
            name="lastname"
            value={lastName}
            onChange={e => updateFields({ lastName: e.target.value })}
          />
          <span>
            {t('LastName')}{' '}
            <i className="required" aria-hidden="true">
              *
            </i>
          </span>
        </label>
      </div>
    </FormWrapper>
  )
}
