// Import necessary libraries

const express = require('express');
const { PredictionServiceClient } = require('@google-cloud/aiplatform');
const app = express();
const { generatePDF, generateHTML }  = require('./pdf');
const sendMail = require('./mail');
const cheerio = require('cheerio');
const { generateImage } = require('./openai');

// Middleware to parse JSON bodies
app.use(express.json());

// Your Google Cloud project ID and location
const { VertexAI } = require('@google-cloud/vertexai');

const projectId = process.env.PROJECT_ID;
const location = process.env.LOCATION;
const modelId = process.env.MODEL_ID;
const modelIdVision = process.env.MODEL_ID_VISION;

if (!projectId || !location || !modelId || !modelIdVision) {
    console.error('Error: The environment variables PROJECT_ID, MODEL_ID, MODEL_ID_VISION and LOCATION must be set.');
    process.exit(1); // Exit the application if variables are not set
}

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({ project: projectId, location: location });

// Instantiate the models
const generativeModel = vertex_ai.getGenerativeModel({
    model: modelId,
    generation_config: {
        "max_output_tokens": 2048,
        "temperature": 0.4,
        "top_p": 1,
        "top_k": 32
    },
    safety_settings: [
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        }
    ],
});

// Enabling CORS for all requests
const cors = require('cors');
app.use(cors());

// Define the endpoint to handle POST requests
app.post('/assistme', async (req, res) => {
    try {
        const { scenario, camera, lens, mail } = req.body;

        if (!scenario || !camera) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters. Please ensure 'scenario' and 'camera', are provided. 'lens' and 'mail' are optional."
            });
        }

        // interact with Vertex AI
        let cameraPrompt = ""
        const outputFormatPrompt = "The output format should be a 7 point bullet point list in html style."

        // 1) ask for camera settings as bullet point list 
        cameraPrompt = "give me 7 important camera setting with explanation for camera " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedSettings = await callVertexAIService(cameraPrompt);
        const returnedSettingsWithoutHTML = htmlListToPlainText(returnedSettings);
        const resultSettings = extractTextFromResponse(returnedSettings);

        //TODO: check tokens remaining. If there is a problem with it return 400, else return 200 and continue
        //res.status(200).send('Request received, processing in the background.');

        // 2) ask for composition tips as bullet point list 
        cameraPrompt = "give me 5 compositions with short samples when i want to photograph with " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedComposition = await callVertexAIService(cameraPrompt);
        const returnedCompositionWithoutHTML = htmlListToPlainText(returnedComposition);
        const resultComposition = extractTextFromResponse(returnedComposition);

        // 3) ask for more creative settings as bullet point list 
        cameraPrompt = "give me 7 extraordanary and creative camera setting with explanation for camera " + camera + (lens ? " and lens " + lens : " which are unusual but creative. I want to have unique photos. I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedCreativeSettings = await callVertexAIService(cameraPrompt);
        const returnedCreativeSettingsWithoutHTML = htmlListToPlainText(returnedCreativeSettings);
        const resultCreativeSettings = extractTextFromResponse(returnedCreativeSettings);

        // 4) ask for more creative composition tips with equipment as bullet point list 
        cameraPrompt = "give me 7 extraordanary and creative compositions with extra equipment  when i want to photograph with " + camera + (lens ? " and lens " + lens : ". Use different positions as normal. I want to have unique photos. I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedCreativeComposition = await callVertexAIService(cameraPrompt);
        const returnedCreativeCompositionWithoutHTML = htmlListToPlainText(returnedCreativeComposition);
        const resultCreativeComposition = extractTextFromResponse(returnedCreativeComposition);

        // 5) ask for things to avoid
        cameraPrompt = "give me 5 things to avoid and common mistakes with camera " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario);
        const returnedAvoid = await callVertexAIService(cameraPrompt);
        const resultAvoid = extractTextFromResponse(returnedAvoid);

        // 6) create an image with 1) and 2)
        cameraPrompt = "Create a realistic image which was taken with " + camera + ". the scenario is " + scenario + ". Use settings from " + returnedSettingsWithoutHTML + ". Use a photo composition from " + returnedCompositionWithoutHTML;
        const imageUrl = "";//await generateImage(cameraPrompt);

        // 7) create an image with 3) and 4)
        cameraPrompt = "Create a realistic image which was taken with " + camera + ". the scenario is " + scenario + ". Use settings from " + returnedCreativeSettingsWithoutHTML + ". Use a photo composition from " + returnedCreativeCompositionWithoutHTML;
        const imageCreativeUrl = "";//await generateImage(cameraPrompt);

        // 8) create html
        const htmlContent = await generateHTML(scenario, resultSettings, resultComposition, resultCreativeSettings,resultCreativeComposition, resultAvoid, imageUrl, imageCreativeUrl);

        // 8) create pdf
        //const pdfBase64 = await generatePDF(scenario, resultSettings, resultComposition, resultCreativeSettings,resultCreativeComposition, resultAvoid, imageUrl, imageCreativeUrl);

        //if (mail) {
        // 9) send mail
        //    await sendMail(mail, pdfBase64);
        //}

        // Set the content type to HTML before sending
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error during prediction:", error);

        // Send back an error response
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

function extractTextFromResponse(response) {
    return response.candidates?.[0]?.content?.parts?.[0]?.text ?? "-";
}

async function callVertexAIService(topic) {
    const req = {
        contents: [{ role: 'user', parts: [{ text: topic }] }],
    };

    const streamingResp = await generativeModel.generateContentStream(req);

    //for await (const item of streamingResp.stream) {
    //    process.stdout.write('stream chunk: ' + JSON.stringify(item));
    //}

    const result = await streamingResp.response;

    process.stdout.write('aggregated response: ' + result);

    return result;
}


/**
 * Converts an HTML list (ul with li elements) into plain text.
 * @param {string} html The HTML string containing the ul list.
 * @returns {string} A plain text string with the list items.
 */
function htmlListToPlainText(html) {
    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    // Initialize an array to hold the text of each list item
    let listItems = [];

    // Use cheerio to find each list item and push its text to the array
    $('ul li').each(function () {
        listItems.push($(this).text().trim());
    });

    // Join the array into a single string, with each item on a new line
    return listItems.join('\n');
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
