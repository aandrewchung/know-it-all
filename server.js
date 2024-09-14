// server.js

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors'); // To allow cross-origin requests from the frontend

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for all routes

const { scrapeImages } = require('./test_js');
// const { searchPimEyes } = require('./pimeyes.js');

// API endpoint to scrape images
app.get('/scrape-images', async (req, res) => {
    try {
        // const images = await searchPimEyes("C:/Users/hugom/Downloads/face_screenshot.png");

        const images = await scrapeImages();
        res.json({ success: true, images: images });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
