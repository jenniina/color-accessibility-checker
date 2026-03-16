import { useEffect } from 'react'
import FormWrapper from './FormWrapper'
import styles from '../form.module.css'
import { HEX } from '../types'
import { Select, SelectOption } from '../../Select/Select'
import useLocalStorage from '../../../hooks/useStorage'
import { useLanguageContext } from '../../../contexts/LanguageContext'

interface ExtrasData {
  encouragement: string
  color: HEX
  dark: string
  light: string
  gdpr: string
  selectmulti: string
  clarification: string
}

interface ExtrasFormProps {
  encouragement: string
  color: HEX
  updateFields: (fields: Partial<ExtrasData>) => void
}

export default function ExtrasForm({
  encouragement,
  color,
  updateFields,
}: ExtrasFormProps) {
  const { t, language } = useLanguageContext()

  const [values, setValues] = useLocalStorage<SelectOption[]>(`multivalues`, [])

  const options: SelectOption[] = [
    { label: t('Yes'), value: t('Yes') },
    { label: t('AppearanceNeedsWork'), value: t('AppearanceNeedsWork') },
    { label: t('AccessibilityIssue'), value: t('AccessibilityIssue') },
    {
      label: `${t('Other')}, ${t('ClarifiedBelow')}`,
      value: t('Other'),
    },
    {
      label: `${t('NotReally')}, ${t('ClarifiedBelow')}`,
      value: t('NotReally'),
    },
  ]

  useEffect(() => {
    updateFields({
      selectmulti: values
        ?.map(element => {
          return element?.value
        })
        .join(', '),
    })
  }, [values, updateFields])

  return (
    <>
      <FormWrapper
        title={t('AdditionalInformation')}
        description={t('NoneOfTheseAreRequired')}
      >
        <div className={styles.subfield}>
          <label className="full left" htmlFor="form-encouragement">
            {t('AnyEncouragingWords')}
          </label>
          <textarea
            id="form-encouragement"
            className="full"
            name="encouragement"
            value={encouragement}
            rows={3}
            placeholder={t('OrConstructiveFeedback')}
            onChange={e => updateFields({ encouragement: e.target.value })}
          />
        </div>
        <div className={styles.subfield}>
          <label
            id="label-color"
            className={`left nowrap full ${styles.colorlabel}`}
            htmlFor="form-color2"
          >
            {t('AColorYouLike')}
          </label>

          <input
            id="form-color2"
            className={`half bg`}
            aria-labelledby="label-color"
            type="text"
            name="color"
            value={color}
            onChange={e => updateFields({ color: e.target.value as HEX })}
          />
          <label className="scr" htmlFor="form-color">
            {t('AColorYouLike')} {t('ColorPicker')}
          </label>
          <input
            id="form-color"
            className={`half`}
            aria-labelledby="label-color"
            type="color"
            name="color"
            value={color}
            onChange={e => updateFields({ color: e.target.value as HEX })}
          />
        </div>
        <div className={styles.subfield}>
          <label className={`full`}>{t('WhichModeDoYouPrefer')}</label>
          <label className="nowrap flex gap-half">
            <span className="radio-span">
              <input
                id="form-dark"
                type="radio"
                name="mode"
                value={'dark mode'}
                onChange={e => updateFields({ dark: e.target.value })}
              />
            </span>{' '}
            {t('DarkMode')}
          </label>
          <label htmlFor="form-light" className="nowrap flex gap-half">
            <span className="radio-span">
              <input
                id="form-light"
                type="radio"
                name="mode"
                value={'light mode'}
                onChange={e => {
                  updateFields({ light: e.target.value })
                }}
              />
            </span>{' '}
            {t('LightMode')}
          </label>
        </div>
        <div className={styles.subfield}>
          <label htmlFor="multiple-hide">{t('DoYouLikeMyCustomSelects')}</label>
          <span style={{ position: 'relative', zIndex: '2', width: '100%' }}>
            <Select
              language={language}
              multiple
              id="multiple-hide"
              className={styles.dropdownmultiple}
              instructions={`${t('PleaseSelectAnOption')}. ${t(
                'YouMaySelectMultipleOptions'
              )}`}
              hide
              options={options}
              value={values}
              onChange={o => {
                setValues(o)
                updateFields({
                  selectmulti: values
                    ?.map(element => {
                      return element?.value
                    })
                    .join(', '),
                })
              }}
            />
          </span>

          {/* <input
            multiple
            type='hidden'
            className='form-control'
            name={`multipleselect`}
            value={values
              ?.map((element) => {
                return element?.value
              })
              .join(', ')}
            onChange={(e) => {
              updateFields({
                selectmulti: values
                  ?.map((element) => {
                    return element?.value
                  })
                  .join(', '),
              })
            }}
          /> */}
          <label className={`full`}>
            <span>{t('Clarification')}</span>
            <input
              className={`bg`}
              type="text"
              name="clarification"
              onChange={e => {
                updateFields({ clarification: e.target.value })
              }}
            />
          </label>
        </div>
        <div>
          <label className="radio-checkbox">
            <input
              id="form-gdpr"
              required
              type="checkbox"
              name="gdpr"
              value={'gdpr-ok'}
              onChange={e => {
                updateFields({ gdpr: e.target.value })
              }}
            />
            <i className="required" aria-hidden="true">
              *
            </i>{' '}
            {t('ItIsAlrightToSendTheEnteredInformationToJenniina')}{' '}
          </label>
        </div>
      </FormWrapper>
    </>
  )
}
