const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

async function searchEverything(imageFilePath) {
  // Launch Puppeteer browser
  const browser = await puppeteer.launch({ headless: true }); 
  const page = await browser.newPage();

  try {
    // Step 1: Navigate to homepage
    await page.goto(process.env.MAIN_URL, { waitUntil: 'networkidle2' });

    // Add a 2-second delay
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

    // Step 2: Handle cookie consent pop-up
    await page.waitForSelector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', { visible: true });
    await page.click('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');

    // Add a 2-second delay
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

    // Step 3: Log in
    await page.goto(process.env.LOGIN_URL, { waitUntil: 'networkidle2' });

    // Add a 2-second delay
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

    // Fill in login form
    await page.type('input[type="email"].form-control', process.env.USER_EMAIL);
    await page.type('input[type="password"].form-control', process.env.USER_PASSWORD);
    await page.click('button[type="submit"]');          

    // Wait for login to complete and page to redirect
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Add a 2-second delay
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

    // Step 4: Upload the image for search
    await page.goto(process.env.SEARCH_URL, { waitUntil: 'networkidle2' });

    // Add a 2-second delay
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

    // Step 5: Click the "Upload photo(s)" button to open the pop-up
    await page.waitForSelector('button[aria-label="Upload photo"]');
    await page.click('button[aria-label="Upload photo"]');

    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

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
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 7500)));

    // Step 8: Check all the required checkboxes
    const checkboxes = await page.$$('input[type="checkbox"]');
    let index = 0;
    for (const checkbox of checkboxes) {
      if (index === 3) break;
      index++;
      await checkbox.evaluate((chk) => chk.scrollIntoView());
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));
      await checkbox.click();
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
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 10000)));
    console.log("finished waiting");

    // Step 3: Wait for images to load
    await page.waitForSelector('.results-row');

    // Step 4: Scrape image URLs (limited to 10)
    let imageData = await page.evaluate(() => {
        const allImageData = [];
        const rows = Array.from(document.querySelectorAll('.results-row'));
      
        let rowIndex = 0;
        let duplicateImageUrls = [];
        for (const row of rows) {
          if (allImageData.length >= 10) break;

          // Handle results-1
          const results1 = row.querySelectorAll('.results-1 .result');
          for (const result of results1) {
            if (allImageData.length >= 10) break;
            const img = result.querySelector('.img img');
            const urlSpan = result.querySelector('.url');
            if (img && img.src) {
                if (urlSpan && urlSpan.textContent) {
                    const parsedUrl = new URL(urlSpan.textContent);
                    const baseUrl = parsedUrl.protocol + '//' + parsedUrl.hostname;
                    if (!duplicateImageUrls.includes(baseUrl)) {
                        duplicateImageUrls.push(baseUrl);
                    } else {
                        continue; // Skip this image if the URL is already in duplicateImageUrls
                    }
                }
                allImageData.push({
                    imageUrl: img.src,
                    originalUrl: 'n/a',  // Placeholder for now, will be replaced later
                    rowIndex: rowIndex,
                    duplicateUrl: urlSpan && urlSpan.textContent ? new URL(urlSpan.textContent).origin : ''
                });

            }
          }
          rowIndex++;
        }

        rowIndex = 0;
        // Handle results that are not results-1 (capture only the first image URL from each group)
        for (const row of rows) {
            if (allImageData.length >= 10) break;

            if (allImageData.length < 10) {
                const resultsNotOne = row.querySelectorAll(':not(.results-1)');
                for (const resultGroup of resultsNotOne) {
                    if (allImageData.length >= 10) break;
                    const firstResult = resultGroup.querySelector('.result');
                    if (firstResult) {
                        const img = firstResult.querySelector('.img img');
                        const urlSpan = firstResult.querySelector('.url'); // Changed from 'result' to 'firstResult'
                        if (img && img.src) {
                            if (urlSpan && urlSpan.textContent) {
                                const parsedUrl = new URL(urlSpan.textContent);
                                const baseUrl = parsedUrl.protocol + '//' + parsedUrl.hostname;
                                if (!duplicateImageUrls.includes(baseUrl)) {
                                    duplicateImageUrls.push(baseUrl);
                                } else {
                                    continue; // Skip this image if the URL is already in duplicateImageUrls
                                }
                            }                     
                            allImageData.push({
                                imageUrl: img.src,
                                originalUrl: 'n/a',
                                rowIndex: rowIndex,
                                duplicateUrl: urlSpan && urlSpan.textContent ? new URL(urlSpan.textContent).origin : ''
                            });
                        }
                    }
                }
            }
            rowIndex++;
        }
      
        return allImageData.slice(0, 10);  // Ensure we return exactly 10 images
      });

    // Step 5: Loop through each image and get the original URL
    for (let i = 0; i < imageData.length; i++) {
      console.log(`Processing image ${i + 1} of ${imageData.length}`);
      const rowIndex = Math.floor(i / 2);
      const columnIndex = (i % 2) + 1;
      const resultSelector = `.results-row.row-${imageData[i].rowIndex} .results-1:nth-child(${columnIndex}) .img img`;
      console.log(`Selector: ${resultSelector}`);

      const element = await page.$(resultSelector);
      if (!element) {
        console.error(`No element found for selector: ${resultSelector}`);
        continue;
      }

      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Processing timeout')), 8000)
        );

        await Promise.race([timeoutPromise, (async () => {
          await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));
          console.log('Clicking on image to open modal...');
          await page.click(resultSelector);

          console.log('Waiting for modal to appear...');
          await page.waitForSelector('.dialog .modal-content', { timeout: 30000 });

          console.log('Looking for "Open website" button...');
          const openWebsiteButtonSelector = await page.evaluateHandle(() => {
            const actionItems = Array.from(document.querySelectorAll('.dialog .modal-content .action-item'));
            for (let item of actionItems) {
              const textElement = item.querySelector('p');
              if (textElement && textElement.textContent.includes('Open website')) {
                return item;
              }
            }
            return null;
          });

          if (openWebsiteButtonSelector) {
            console.log('"Open website" button found. Preparing to open new tab...');
            const newPagePromise = new Promise(resolve => browser.once('targetcreated', target => resolve(target.page())));
            await openWebsiteButtonSelector.click();
            console.log('Waiting for new tab to open...');
            const newPage = await newPagePromise;

            console.log('New tab opened. Waiting for navigation...');
            await newPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 1000 }).catch(() => {
              console.log('Navigation timeout in new tab. Continuing...');
            });

            const originalUrl = newPage.url();
            console.log('Original URL:', originalUrl);
            imageData[i].originalUrl = originalUrl;

            console.log('Closing new tab...');
            await newPage.close();
          } else {
            console.log(`"Open website" button not found for result ${i + 1}`);
          }

          await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

          console.log('Closing modal on main page...');
          await page.keyboard.press('Escape');
          
          console.log('Image processing complete.');
        })()]);

      } catch (error) {
        if (error.message === 'Processing timeout') {
          console.log(`Processing timeout for image ${i + 1}. Moving to next image.`);
        } else {
          console.error(`Error processing image ${i + 1}:`, error.message);
        }
        // Ensure modal is closed before moving to next image
        await page.keyboard.press('Escape').catch(() => {});
      }
    }

    // Save the image data (both image URLs and original URLs) to a local JSON file
    fs.writeFileSync('imageData.json', JSON.stringify(imageData, null, 2));

    console.log('Image data saved to imageData.json');

    return imageData;

  } catch (error) {
    console.error('Error during search:', error);
    return [];
  } finally {
    // Close the browser after this step
    await browser.close();
  }
}

module.exports = { searchEverything };
