// Import necessary libraries

const express = require('express');
const app = express();
const { generatePDF, generateHTML, generateJSON } = require('./pdf');
const sendMail = require('./mail');
const { generateImage } = require('./openai');
const { getData, saveData } = require('./gatekeeper');
const { callVertexAIService } = require('./vertex');

// Middleware to parse JSON bodies
app.use(express.json());

// Enabling CORS for all requests
const cors = require('cors');
app.use(cors());

// Define the endpoint to handle POST requests
app.get('/api/process', async (req, res) => {

    let fileName = "";

    try {

        const result = await getData();

        const camera = result.data.camera;
        const scenario = result.data.scenario;
        const lens = result.ldata.ens;
        const mail = result.data.mail;
        fileName = result.fileName;

        // interact with Vertex AI
        let cameraPrompt = ""
        //TODO: Currently ignored by the vertex ai api
        //const outputFormatPrompt = "The output format should be a point bullet point list in html."
        const outputFormatPrompt = "";

        // 1) ask for camera settings as bullet point list 
        cameraPrompt = "give me 7 important camera setting with explanation for camera " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedSettings = await callVertexAIService(cameraPrompt);
        const resultSettings = extractTextFromResponse(returnedSettings);

        // // 2) ask for composition tips as bullet point list 
        cameraPrompt = "give me 7 compositions with explanation when i want to photograph with " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedComposition = await callVertexAIService(cameraPrompt);
        const resultComposition = extractTextFromResponse(returnedComposition);

        // // 3) ask for more creative settings as bullet point list 
        cameraPrompt = "give me 7 extraordinary and creative camera setting with explanation for camera " + camera + (lens ? " and lens " + lens : " which are unusual but creative. I want to have unique photos. I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedCreativeSettings = await callVertexAIService(cameraPrompt);
        const resultCreativeSettings = extractTextFromResponse(returnedCreativeSettings);

        // // 4) ask for more creative composition tips with equipment as bullet point list 
        cameraPrompt = "give me 7 extraordinary compositions with extra equipment and creative camera settings with explanation when i want to photograph with " + camera + (lens ? " and lens " + lens : ". Use different positions as normal. I want to have unique photos. I want to shoot the scenario " + scenario + "." + outputFormatPrompt);
        const returnedCreativeComposition = await callVertexAIService(cameraPrompt);
        const resultCreativeComposition = extractTextFromResponse(returnedCreativeComposition);

        // // 5) ask for things to avoid
        cameraPrompt = "give me 7 things to avoid and common mistakes with camera " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario);
        const returnedAvoid = await callVertexAIService(cameraPrompt);
        const resultAvoid = extractTextFromResponse(returnedAvoid);

        // // 6) create an image with 1) and 2)
        //TODO: implement image generation with vertex ai, aws or openai

        // // 7) create an image with 3) and 4)
        //TODO: implement image generation with vertex ai, aws or openai

        if (mail) {

            // 8) create pdf
            const pdfBase64 = await generatePDF(scenario, resultSettings, resultComposition, resultCreativeSettings, resultCreativeComposition, resultAvoid);

            //DEBUG 
            //const content = await generateHTML(scenario, resultSettings, resultComposition, resultCreativeSettings, resultCreativeComposition, resultAvoid);

            // send mail
            await sendMail(mail, pdfBase64);

            await deleteFile(fileName);

            res.status(200).json({ success: true });
        }
        else {
            // create json
            const json = await generateJSON(scenario, resultSettings, resultComposition, resultCreativeSettings, resultCreativeComposition, resultAvoid);

            // delete 
            await deleteFile(fileName);

            // return json
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
