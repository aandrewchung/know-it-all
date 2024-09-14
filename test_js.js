const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeImages() {
  // Launch Puppeteer browser
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the example result page
  await page.goto('https://pimeyes.com/en/results/ERx_240913r62zfg0dn776cnod896374b?query=e3dbebeb000040749cbe9e88feaf0088', { waitUntil: 'networkidle2' });

  // Wait for the page to fully load
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 5000)));
  console.log("finished waiting");
  
  // Ensure that the results rows are loaded
  await page.waitForSelector('.results-row');

  // Scrape all image URLs from the results
  let imageUrls = await page.evaluate(() => {
    const allImageUrls = [];
    const rows = Array.from(document.querySelectorAll('.results-row'));

    rows.forEach(row => {
      // Handle results-1
      const results1 = row.querySelectorAll('.results-1 .result');
      results1.forEach(result => {
        const img = result.querySelector('.img img');
        if (img && img.src && !allImageUrls.includes(img.src)) {
          allImageUrls.push(img.src);
        }
      });

      // Handle results that are not results-1 (capture only the first image URL)
      const resultsNotOne = row.querySelectorAll(':not(.results-1)');
      resultsNotOne.forEach(resultGroup => {
        const firstResult = resultGroup.querySelector('.result');
        if (firstResult) {
          const img = firstResult.querySelector('.img img');
          if (img && img.src && !allImageUrls.includes(img.src)) {
            allImageUrls.push(img.src); // Save only the first image URL from each non-results-1 group
          }
        }
      });
    });

    return allImageUrls;
  });

  // Log the image URLs to check the results
  console.log(imageUrls);

  // Save the image URLs to a local JSON file
  fs.writeFileSync('imageUrls.json', JSON.stringify(imageUrls, null, 2));

  console.log('Image URLs saved to imageUrls.json');

  // Close the browser
  await browser.close();
}

// Export the function if needed for external use
module.exports = { scrapeImages };
