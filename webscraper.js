const puppeteer = require('puppeteer');

async function scrapeTextFromWebsite(url) {
  let browser;
  try {
    // Launch a new browser instance
    browser = await puppeteer.launch();
    
    // Open a new page
    const page = await browser.newPage();
    
    // Navigate to the provided URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract all text content from the page
    const pageText = await page.evaluate(() => {
      return document.body.innerText;
    });

    // Return the text content
    return pageText;
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return '';
  } finally {
    // Close the browser if it was successfully launched
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {scrapeTextFromWebsite };

// The following code can be commented out or removed if not needed in this file
/*
// Accept the URL as a command-line argument
const url = process.argv[2];

if (!url) {
  console.error('Please provide a URL as an argument.');
  process.exit(1);
}

scrapeTextFromWebsite(url);
*/
