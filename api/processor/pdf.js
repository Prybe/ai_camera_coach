const fs = require('fs/promises');
const marked = require('marked');
var puppeteer = require("puppeteer");

// Function to convert HTML to PDF Buffer using WeasyPrint
async function generatePDF(scenario, resultSettings, resultComposition, resultCreativeSettings, resultCreativeComposition, avoid) {

    let browser = null;

    try {
        const updatedHtml = await generateHTML(scenario, resultSettings, resultComposition, resultCreativeSettings, resultCreativeComposition, avoid);

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

async function generateHTML(scenario, settings, composition, creativeSettings, creativeComposition, avoid) {
    try {
        // Step 1: Read the HTML template
        const templateHtml = await fs.readFile('template.html', 'utf8');

        const resultSetting = parseAndStyleHtml(settings);
        const resultComposition = parseAndStyleHtml(composition);
        const resultSettingCreative = parseAndStyleHtml(creativeSettings);
        const resultCompositionCreative = parseAndStyleHtml(creativeComposition);
        const finalAvoid = parseAndStyleHtml(avoid);

        // Step 2: Replace placeholder text with actual content
        let updatedHtml = templateHtml.replace('PLACEHOLDER_CAMERA_SETTINGS', resultSetting);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_COMPOSITION_TIPS', resultComposition);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_SCENARIO', scenario);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_AVOID', finalAvoid);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_CREATIVE_CAMERA_SETTINGS', resultSettingCreative);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_CREATIVE_COMPOSITION_TIPS', resultCompositionCreative);

        return updatedHtml;
    } catch (error) {
        console.error('Error generating HTML:', error);
        throw error;
    }
}

async function generateJSON(scenario, settings, composition, creativeSettings, creativeComposition, avoid) {
    try {
        // Construct the JSON object from the provided parameters
        const cameraSettingHTML = await parseAndStyleHtml(settings);
        const cameraCompositionHTML = await parseAndStyleHtml(composition);
        const creativeCameraSettingHTML = await parseAndStyleHtml(creativeSettings);
        const creativeCameraCompositionHTML = await parseAndStyleHtml(creativeComposition);
        const avoidHTML = await parseAndStyleHtml(avoid);

        const json = {
            scenario: scenario,
            cameraSetting: settings,
            cameraComposition: composition,
            creativeCameraSetting: creativeSettings,
            creativeCameraComposition: creativeComposition,
            avoid: avoid,
            cameraSettingHTML: cameraSettingHTML,
            cameraCompositionHTML: cameraCompositionHTML,
            creativeCameraSettingHTML: creativeCameraSettingHTML,
            creativeCameraCompositionHTML: creativeCameraCompositionHTML,
            avoidHTML: avoidHTML
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
    return setStyle(parsedText);
}

/**
 * HTTP function that replaces the first <li> tag with <li2>
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
 function replaceTag(text) {
    // Use regex to find all <li> tags
    const regex = /<\/ul>/g;
    let match;

    // Loop through all matches
    while ((match = regex.exec(text)) !== null) {

        // Check if the index of the match is over X
        if (match.index > 1900) {
            // Replace the match with <li className='..'>
            text = text.substring(0, match.index) + '</ul><p class="new-page-after">' + text.substring(match.index + 5);
            break;
        }
    }

    return text;
}

function setStyle(text) {
    let result = replaceTag(text);
    return result.replace(/<\/li>/g, "</li><br>");
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
    generateJSON,
    generateHTML
};