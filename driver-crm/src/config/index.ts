export const CONFIG = {
  COMPANY_NAME: 'BotiLogistics',
  // Google Sheets ID для прямого читання через gviz API
  SPREADSHEET_ID: '1Ku__ll0kDvp5dCeaS6QdnHrGGeoic-rykib6N1L7jeQ',
  // Apps Script — тільки для запису (updateDriverStatus)
  API_URL:
    'https://script.google.com/macros/s/AKfycbyJoyU3Id-rDBmAxxLovr1Sd3uvOPXhplQslf8xE-JvzZmKqMrF8eZrmzgFK9apJiL6Jg/exec',
  // Маршрути (hardcoded)
  ROUTES: ['Маршрут_1', 'Маршрут_2', 'Маршрут_3'],
  SHIPPING: [
    { name: 'Відправка_1', label: 'Відправка 1' },
    { name: 'Відправка_2', label: 'Відправка 2' },
    { name: 'Відправка_3', label: 'Відправка 3' },
  ],
};
