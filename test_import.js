// test_import.js

const { scrapeImages } = require('./test_js');

// Call the scrapeImages function
scrapeImages().then(() => {
  console.log('Image scraping completed.');
}).catch(error => {
  console.error('Error occurred during image scraping:', error);
});
