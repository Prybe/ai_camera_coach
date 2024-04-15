const fs = require('fs/promises');
const marked = require('marked');
var puppeteer = require("puppeteer");
const { JSDOM } = require('jsdom');

// Function to convert HTML to PDF Buffer using WeasyPrint
async function generatePDF(scenario, cameraSettingComposition, creativeSettingsComposition, avoid) {

    const updatedHtml = await generateHTML(scenario, cameraSettingComposition, creativeSettingsComposition, avoid);

    let browser = null;
    try {
        // Launch a headless browser
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        // Open a new page
        const page = await browser.newPage();

        // Set your HTML content
        await page.setContent(updatedHtml, {
            waitUntil: 'networkidle0' // Wait for all resources to be loaded
        });

        // Generate a PDF with background rendering enabled and return as a buffer
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true // Ensure this is true to print backgrounds
        });

        return pdfBuffer;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}

async function generateHTML(scenario, cameraSettingComposition, creativeSettingsComposition, avoid) {
    try {
        // Step 1: Read the HTML template
        const templateHtml = await fs.readFile('template.html', 'utf8');

        const result = parseAndStyleHtml2(cameraSettingComposition);
        const resultCreative = parseAndStyleHtml2(creativeSettingsComposition);
        const finalAvoid = parseAndStyleHtml(avoid);

        // Step 2: Replace placeholder text with actual content
        let updatedHtml = templateHtml.replace('PLACEHOLDER_CAMERA_SETTINGS', result[0].text);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_COMPOSITION_TIPS', result[1].text);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_SCENARIO', scenario);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_AVOID', finalAvoid);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_CREATIVE_CAMERA_SETTINGS', resultCreative[0].text);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_CREATIVE_COMPOSITION_TIPS', resultCreative[1].text);

        return updatedHtml;
    } catch (error) {
        console.error('Error generating HTML:', error);
        throw error;
    }
}

async function generateJSON(scenario, cameraSettingComposition, creativeSettingsComposition, avoid) {
    try {
        // Construct the JSON object from the provided parameters
        const json = {
            scenario: scenario,
            cameraSettingAndComposition: cameraSettingComposition,
            creativeCameraSettingAndComposition: creativeSettingsComposition,
            avoid: avoid
        };

        // Return the constructed JSON object
        return json;
    } catch (error) {
        console.error('Error generating JSON:', error);
        throw error;
    }
}

/**
 * 
 * @param {string} htmlText The text in html format.
 * @returns {string} HTML string with inline style.
 */
function parseAndStyleHtml(markdownText) {

    const parsedText = marked.parse(markdownText);
    return parsedText.replace(/<li/g, "<li style=\"margin-bottom: 10px; letter-spacing: 0.1px;\"");
}

function parseAndStyleHtml2(markdownText) {
    // Parse markdown to HTML
    const parsedHtml = marked.parse(markdownText);

    // Create a new JSDOM instance with the parsed HTML
    const dom = new JSDOM(parsedHtml);
    const document = dom.window.document;

    // Find all <li> elements
    const listItems = document.querySelectorAll('li');
    
    // Create an array to hold objects representing each <li>
    const listItemTexts = [];

    // Iterate over each <li> element
    listItems.forEach((li, index) => {
        // Push the text content of each <li> into the array as an object
        listItemTexts.push({ id: index, text: li.textContent });
    });

    // Return the array of objects
    return listItemTexts;
}

/**
 * Generates HTML code for displaying an image with specific dimensions.
 * 
 * @param {string} imageUrl The URL of the image to be displayed.
 * @return {string} HTML string for the img element.
 */
function parseAndStyleImage(imageUrl) {
    // Validate the input to ensure it's a properly formatted URL.
    try {
        new URL(imageUrl);
    } catch (error) {
        throw new Error("Invalid URL provided");
    }

    // Create and return the HTML string for the image element
    // with the specified dimensions (1024x1024).
    return `<img src="${imageUrl}" width="1024" height="1024" alt="Image"/>`;
}

module.exports = {
    generatePDF,
    generateHTML,
    generateJSON
};