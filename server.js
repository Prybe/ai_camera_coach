// Import necessary libraries

const express = require('express');
const app = express();
const { generatePDF, generateHTML, generateJSON } = require('./pdf');
const sendMail = require('./mail');
const { generateImage } = require('./openai');
const { accessAllowed } = require('./gatekeeper');
const { callVertexAIService } = require('./vertex');

// Middleware to parse JSON bodies
app.use(express.json());

// Enabling CORS for all requests
const cors = require('cors');
app.use(cors());

// ping with gatekeeper
app.get('/ping', async (req, res) => {
    try {
        if (await !accessAllowed()) {
            return res.status(403).json({
                success: false,
                message: "Maximum number of daily calls reached. Try it tomorrow."
            });
        }

        res.status(200).json({ success: true, message: "Pong" });
    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error during prediction:", error);

        // Send back an error response
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

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

        if (await !accessAllowed()) {
            return res.status(403).json({
                success: false,
                message: "Maximum number of daily calls reached. Try it tomorrow."
            });
        }

        // interact with Vertex AI
        let cameraPrompt = ""
        const outputFormatPrompt = "The output format should be a 7 point bullet point list in html style."

        // 1) ask for camera settings as bullet point list 
        cameraPrompt = "give me 7 important camera setting with explanation for camera " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedSettings = await callVertexAIService(cameraPrompt);
        const resultSettings = extractTextFromResponse(returnedSettings);

        // TODO: check response (tokens etc)        
        console.log(returnedSettings);

        if (mail) {
            // TODO: no need to wait
        }

        // // 2) ask for composition tips as bullet point list 
        cameraPrompt = "give me 5 compositions with short samples when i want to photograph with " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedComposition = await callVertexAIService(cameraPrompt);
        const resultComposition = extractTextFromResponse(returnedComposition);

        // // 3) ask for more creative settings as bullet point list 
        cameraPrompt = "give me 7 extraordanary and creative camera setting with explanation for camera " + camera + (lens ? " and lens " + lens : " which are unusual but creative. I want to have unique photos. I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedCreativeSettings = await callVertexAIService(cameraPrompt);
        const resultCreativeSettings = extractTextFromResponse(returnedCreativeSettings);

        // // 4) ask for more creative composition tips with equipment as bullet point list 
        cameraPrompt = "give me 7 extraordanary and creative compositions with extra equipment  when i want to photograph with " + camera + (lens ? " and lens " + lens : ". Use different positions as normal. I want to have unique photos. I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedCreativeComposition = await callVertexAIService(cameraPrompt);
        const resultCreativeComposition = extractTextFromResponse(returnedCreativeComposition);

        // // 5) ask for things to avoid
        cameraPrompt = "give me 5 things to avoid and common mistakes with camera " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario);
        const returnedAvoid = await callVertexAIService(cameraPrompt);
        const resultAvoid = extractTextFromResponse(returnedAvoid);

        // // 6) create an image with 1) and 2)
        //TODO: implement image generation with vertex ai, aws or openai

        // // 7) create an image with 3) and 4)
        //TODO: implement image generation with vertex ai, aws or openai


        if (mail) {

            // 8) create pdf
            const pdfBase64 = await generatePDF(scenario, resultSettings, resultComposition, resultCreativeSettings, resultCreativeComposition, resultAvoid);

            // 9) send mail
            await sendMail(mail, pdfBase64);

            res.status(200).json({ success: true });
        }
        else {
            // 8) create json
            const json = await generateJSON(scenario, resultSettings, resultComposition, resultCreativeSettings, resultCreativeComposition, resultAvoid);

             // 9) send json
            res.status(200).json({ success: true, data: json });
        }
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
