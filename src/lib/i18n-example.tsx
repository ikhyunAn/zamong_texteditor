// Example usage of i18n in your Next.js 15 app components

import { useTranslation } from 'react-i18next';

// Example functional component using translations
export function ExampleComponent() {
  const { t, i18n } = useTranslation('common');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('hello')}</p>
      
      <nav>
        <a href="/">{t('navigation.home')}</a>
        <a href="/about">{t('navigation.about')}</a>
        <a href="/contact">{t('navigation.contact')}</a>
      </nav>
      
      <div>
        <button onClick={() => changeLanguage('en')}>
          {t('english')}
        </button>
        <button onClick={() => changeLanguage('ko')}>
          {t('korean')}
        </button>
      </div>
      
      <div>
        <button>{t('buttons.save')}</button>
        <button>{t('buttons.cancel')}</button>
      </div>
    </div>
  );
}

// For pages directory (if using pages router):
// import { GetStaticProps } from 'next';
// import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
//
// export const getStaticProps: GetStaticProps = async ({ locale }) => {
//   return {
//     props: {
//       ...(await serverSideTranslations(locale ?? 'en', ['common'])),
//     },
//   };
// };
