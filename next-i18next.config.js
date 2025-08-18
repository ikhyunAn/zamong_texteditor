module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko'],
    localePath: './public/locales',
    reloadOnPrerender: process.env.NODE_ENV === 'development',
  },
  fallbackLng: {
    default: ['en'],
    ko: ['en'],
  },
  debug: process.env.NODE_ENV === 'development',
  saveMissing: false,
  strictMode: true,
  serializeConfig: false,
  react: {
    useSuspense: false,
  },
  ns: ['common'],
  defaultNS: 'common',
};
