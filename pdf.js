const fs = require('fs/promises');
const puppeteer = require('puppeteer');
const marked = require('marked');

async function generatePDF(scenario, cameraSetting, compositionTips, creativeSetting, creativeCompositionTips, avoid, imageUrl, imageUrlCreative) {
    try {
        const updatedHtml = await generateHTML(scenario, cameraSetting, compositionTips, creativeSetting, creativeCompositionTips, avoid, imageUrl, imageUrlCreative);

        // Step 3: Launch a headless browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Step 4: Set the content of the page to the updated HTML
        await page.setContent(updatedHtml);
        
        // Step 5: Generate PDF from the page content
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        
        // Step 6: Convert PDF buffer to base64
        const pdfBase64 = pdfBuffer.toString('base64');
        
        // Step 7: Close the browser
        await browser.close();
        
        // Step 8: Return the base64 PDF
        return pdfBase64;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}

async function generateHTML(scenario, cameraSetting, compositionTips, creativeSetting, creativeCompositionTips, avoid) {
    try {
        // Step 1: Read the HTML template
        const templateHtml = await fs.readFile('template.html', 'utf8');
        
        const finalCameraSetting = parseAndStyleHtml(cameraSetting);
        const finalCompositionTips = parseAndStyleHtml(compositionTips);
        const finalCreativeSetting = parseAndStyleHtml(creativeSetting);     
        const finalCreativeCompositionTips = parseAndStyleHtml(creativeCompositionTips);     
        const finalAvoid = parseAndStyleHtml(avoid);  

        // Step 2: Replace placeholder text with actual content
        let updatedHtml = templateHtml.replace('PLACEHOLDER_CAMERA_SETTINGS', finalCameraSetting);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_COMPOSITION_TIPS', finalCompositionTips);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_SCENARIO', scenario);        
        updatedHtml = updatedHtml.replace('AVOID', finalAvoid);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_CREATIVE_CAMERA_SETTINGS', finalCreativeSetting);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_CREATIVE_COMPOSITION_TIPS', finalCreativeCompositionTips);
        
        return updatedHtml;
    } catch (error) {
        console.error('Error generating HTML:', error);
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
    return parsedText.replace("<li", "<li style=\"margin-bottom: 10px; letter-spacing: 0.1px;\"");
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
    generateHTML
  };