import { FC } from 'react'
import { useLanguageContext } from '../../contexts/LanguageContext'
import { Link } from 'react-router-dom'

const Footer: FC = () => {
  const { t } = useLanguageContext()
  return (
    <footer id="main-footer" className="main-footer" tabIndex={-1}>
      <div className="inner">
        <a className="copyright" href="https://jenniina.fi/">
          &copy; {new Date().getFullYear()} Jenniina Laine
        </a>
        <a className="footer1" href="https://react.jenniina.fi/">
          <span>{t('ReactPortfolio')}</span>
        </a>
        <Link to="/info">{t('PrivacyPolicy')}</Link>
      </div>
    </footer>
  )
}

export default Footer
