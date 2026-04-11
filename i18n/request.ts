// // i18n/request.ts
// // Request configuration for next-intl

// import { getRequestConfig } from 'next-intl/server';
// import { notFound } from 'next/navigation';

// export default getRequestConfig(async ({ locale }) => {
//   // Validate that the incoming locale parameter is valid
//   const locales = ['en', 'fr', 'es', 'pt', 'sw'];
//   if (!locales.includes(locale as any)) notFound();

//   return {
//     locale,
//     messages: (await import(`./messages/${locale}.json`)).default
//   };
// });