import FormMulti from '../../components/FormMulti/FormMulti'
import { useLanguageContext } from '../../contexts/LanguageContext'
import SEO from '../../components/SEO/SEO'
import Heading from '../Heading/Heading'

export default function Contact({ type }: { type: string }) {
  const { t } = useLanguageContext()

  return (
    <>
      <SEO
        title={`${t('ContactForm')} | colors.jenniina.fi`}
        description={t('ContactForm') + ' | ' + t('GetInTouch')}
        canonicalUrl={'https://colors.jenniina.fi/contact'}
      />{' '}
      <Heading title={`${t('Contact')}`} subtitle={`${t('GetInTouch')}`} />
      <div className={`contact ${type} marginauto`}>
        <div className="inner-wrap">
          <section
            className="card"
            style={{ position: 'relative', zIndex: '2' }}
          >
            <div>
              <FormMulti />
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
