const puppeteer = require('puppeteer');
const fs = require('fs');

async function searchPimEyes(imageFilePath) {
  // Launch Puppeteer browser
  const browser = await puppeteer.launch({ headless: false }); 
  const page = await browser.newPage();

  try {
    // Step 1: Navigate to PimEyes homepage
    await page.goto('https://pimeyes.com', { waitUntil: 'networkidle2' });

    // Add a 2-second delay
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

    // Step 2: Handle cookie consent pop-up
    await page.waitForSelector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', { visible: true });
    await page.click('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');

    // Add a 2-second delay
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

    // Step 3: Log in to PimEyes
    await page.goto('https://pimeyes.com/en/login', { waitUntil: 'networkidle2' });

    // Add a 2-second delay
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

    // Fill in login form
    await page.type('input[type="email"].form-control', 'hugomart716@gmail.com'); // Your email
    await page.type('input[type="password"].form-control', 'Hackproject123.');     // Your password
    await page.click('button[type="submit"]');          

    // Wait for login to complete and page to redirect
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Add a 2-second delay
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 120000)));

    // Step 4: Upload the image for search
    await page.goto('https://pimeyes.com/en', { waitUntil: 'networkidle2' });

    // Add a 2-second delay
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

    // Step 5: Click the "Upload photo(s)" button to open the pop-up
    await page.waitForSelector('button[aria-label="Upload photo"]');
    await page.click('button[aria-label="Upload photo"]');

    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

    // Step 6: Wait for the pop-up and find the element by text
    await page.waitForSelector('.dropzone'); // Waiting for the dropzone to appear

    // Step 7: Find the file input element and upload the image
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(imageFilePath);
      console.log('Image uploaded successfully');
    } else {
      console.error('File input not found');
      return []; // Return an empty array if file upload fails
    }

    console.log('Image uploaded successfully');

    // Add a 5-second delay for the image to process and the popup to appear
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 10000)));

    // Step 8: Check all the required checkboxes
    const checkboxes = await page.$$('input[type="checkbox"]');
    let index = 0;
    for (const checkbox of checkboxes) {
      if (index === 3) break;
      index++;
      await checkbox.evaluate((chk) => chk.scrollIntoView());
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));
      await checkbox.click();
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));
    }

    console.log('All checkboxes checked');

    // Step 9: Find the "Start Search" button by its text content and interact with it
    const startSearchButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.trim() === 'Start Search');
    });

    if (startSearchButton) {
      // Wait for navigation after clicking the button
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }), // Wait for navigation to complete
        page.evaluate((btn) => {
          if (btn) {
            btn.scrollIntoView();
            btn.click();
          }
        }, startSearchButton)
      ]);
      console.log('Search started and navigation completed');
    } else {
      console.error('Start Search button not found');
      return []; // Return an empty array if the search button is not found
    }

    // Step 10: Scrape image URLs from the results page
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

    return imageUrls.length > 6 ? imageUrls.slice(0, 6) : imageUrls;

  } catch (error) {
    console.error('Error during PimEyes search:', error);
    return [];
  } finally {
    // Close the browser after this step
    await browser.close();
  }
}

module.exports = { searchPimEyes };
