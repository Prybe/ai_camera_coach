const fs = require('fs/promises');
const puppeteer = require('puppeteer');

async function generatePDF(content) {
    try {
        // Step 1: Read the HTML template
        const templateHtml = await fs.readFile('template.html', 'utf8');
        
        // Step 2: Replace placeholder text with actual content
        const updatedHtml = templateHtml.replace('PLACEHOLDER_CAMERA_SETTINGS', content);
        
        // Step 3: Launch a headless browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Step 4: Set the content of the page to the updated HTML
        await page.setContent(updatedHtml);
        
        // Step 5: Generate PDF from the page content
        const pdfBuffer = await page.pdf();
        
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

module.exports = generatePDF;