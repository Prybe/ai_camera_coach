const fs = require('fs/promises');
const marked = require('marked');
//const { exec } = require('child_process');

// Function to convert HTML to PDF Buffer using WeasyPrint
async function generatePDF_Py(scenario, cameraSetting, compositionTips, creativeSetting, creativeCompositionTips, avoid, imageUrl, imageUrlCreative) {

    const updatedHtml = await generateHTML(scenario, cameraSetting, compositionTips, creativeSetting, creativeCompositionTips, avoid, imageUrl, imageUrlCreative);

    // const pythonProcess = exec('python html_to_pdf.py', (error, stdout, stderr) => {
    //     if (error) {
    //         console.error(`exec error: ${error}`);
    //         throw error;
    //     }
    //     if (stderr) {
    //         console.error(`stderr: ${stderr}`);
    //         throw error;
    //     }
    //     // stdout contains the base64-encoded PDF
    //     const pdfBuffer = Buffer.from(stdout, 'base64');
    //     callback(null, pdfBuffer);
    // });

    // // Send the HTML content to the Python script
    // pythonProcess.stdin.write(updatedHtml);
    // pythonProcess.stdin.end();
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
    generatePDF_Py,
    generateHTML
};