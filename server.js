// server.js

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors'); // To allow cross-origin requests from the frontend

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for all routes

// const { scrapeImages } = require('./test_js');
const { searchEverything } = require('./script.js');
const { scrapeTextFromWebsite } = require('./webscraper.js');
const { generateText } = require('./gpt.js');
const fs = require('fs');

// API endpoint to scrape images
app.get('/scrape-images', async (req, res) => {
    try {
        const imageData = await searchEverything("/Users/andrewchung/Downloads/face_screenshot.png");
        
        // Extract image URLs and remove duplicates from original URLs
        const images = imageData.map(item => item.imageUrl);
        const originalUrls = [...new Set(imageData.map(item => item.originalUrl))].filter(url => url !== 'n/a');

        let combinedText = '';
        for (const url of originalUrls) {
            const text = await scrapeTextFromWebsite(url);
            combinedText += text + ' ';
        }
        fs.writeFileSync('sample.json', JSON.stringify({ text: combinedText.trim() }, null, 2));
        console.log('Combined text saved to sample.json');

        const result = await generateText(combinedText.trim());
        console.log(result);

        res.json({ success: true, images: images, text: result });

        // Delete file from downloads
        const filePath = "/Users/andrewchung/Downloads/face_screenshot.png";

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Error deleting file: ${err}`);
            } else {
                console.log(`File ${filePath} successfully deleted`);
            }
        });

        // create html file
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
