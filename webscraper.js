const puppeteer = require('puppeteer');

async function scrapeTextFromWebsite(url) {
  // Launch a new browser instance
  const browser = await puppeteer.launch();
  
  // Open a new page
  const page = await browser.newPage();
  
  try {
    // Navigate to the provided URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract all text content from the page
    const pageText = await page.evaluate(() => {
      return document.body.innerText;
    });

    // Log the text content
    console.log(pageText);
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Accept the URL as a command-line argument
const url = process.argv[2];

if (!url) {
  console.error('Please provide a URL as an argument.');
  process.exit(1);
}

scrapeTextFromWebsite(url);
