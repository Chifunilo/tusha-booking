// // middleware.ts
// // Place this file in your project root (same level as package.json)

// import createMiddleware from 'next-intl/middleware';
// // import { locales, defaultLocale } from './i18n/config';
// import { locales,defaultLocale } from './i18n/config';

// export default createMiddleware({
//   locales,
//   defaultLocale,
//   localePrefix: 'as-needed' // Don't add /en prefix for default locale
// });

// export const config = {
//   // Match all pathnames except for:
//   // - api routes
//   // - _next (Next.js internals)
//   // - files with extensions (e.g. favicon.ico)
//   matcher: ['/((?!api|_next|.*\\..*).*)']
// };