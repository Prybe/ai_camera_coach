const fs = require('fs/promises');
const puppeteer = require('puppeteer');
const marked = require('marked');

async function generatePDF(scenario, cameraSetting, compositionTips, creativeSetting, creativeCompositionTips, avoid, settingForSample, creativeSettingsForSample) {
    try {
        // Step 1: Read the HTML template
        const templateHtml = await fs.readFile('template.html', 'utf8');
        
        const finalCameraSetting = parseAndStyleMarkdown(cameraSetting);
        const finalCompositionTips = parseAndStyleMarkdown(compositionTips);
        const finalCreativeSetting = parseAndStyleMarkdown(creativeSetting);     
        const finalCreativeCompositionTips = parseAndStyleMarkdown(creativeCompositionTips);     
        const finalAvoid = parseAndStyleMarkdown(avoid);     
        const finalSettingForSample = parseAndStyleMarkdown(settingForSample);     
        const finalCreativeSettingsForSample = parseAndStyleMarkdown(creativeSettingsForSample);     

        // Step 2: Replace placeholder text with actual content
        let updatedHtml = templateHtml.replace('PLACEHOLDER_CAMERA_SETTINGS', finalCameraSetting);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_COMPOSITION_TIPS', finalCompositionTips);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_SCENARIO', scenario);        
        updatedHtml = updatedHtml.replace('AVOID', finalAvoid);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_CREATIVE_CAMERA_SETTINGS', finalCreativeSetting);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_CREATIVE_COMPOSITION_TIPS', finalCreativeCompositionTips);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_SETTINGS_FOR_SAMPLE', finalSettingForSample);
        updatedHtml = updatedHtml.replace('PLACEHOLDER_CREATIVE_SETTINGS_FOR_SAMPLE', finalCreativeSettingsForSample);

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

function parseAndStyleMarkdown(markdownText) {
    const parsedText = marked.parse(markdownText);
    return parsedText.replace("<li", "<li style=\"margin-bottom: 10px; letter-spacing: 0.1px;\"");
}


module.exports = generatePDF;