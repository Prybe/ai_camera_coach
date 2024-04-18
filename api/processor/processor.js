// Import necessary libraries

const express = require('express');
const app = express();
const { generatePDF, generateHTML, generateJSON } = require('./pdf');
const sendMail = require('./mail');
const { generateImage } = require('./openai');
const { getData, saveData, deleteData } = require('./gatekeeper');
const { callVertexAIService } = require('./vertex');

// Middleware to parse JSON bodies
app.use(express.json());

// Enabling CORS for all requests
const cors = require('cors');
app.use(cors());

// Define the endpoint to handle POST requests
app.get('/api/process', async (req, res) => {

    let fileName = "";
    let camera = "";
    let scenario = "";
    let lens = "";

    try {

        const result = await getData();

        if (result == null) {
            return res.status(200).send({ message: "no files." })
        }

        camera = result.data.camera;
        scenario = result.data.scenario;
        lens = result.data.lens;
        mail = result.data.mail;
        fileName = result.fileName;

        // interact with Vertex AI
        let cameraPrompt1 = ""
        let cameraPrompt2 = ""

        //TODO: Currently ignored by the vertex ai api
        //const outputFormatPrompt = "The output format should be a point bullet point list in html."
        const outputFormatPrompt = "";

        // 1) ask for camera settings as bullet point list 
        cameraPrompt1 = "give me 7 camera setting with explanation when i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : + ".");

        // // 2) ask for composition tips as bullet point list 
        cameraPrompt2 = "give me 7 compositions with explanation when i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : ".");
        const returned = await callVertexAIService(cameraPrompt1 + cameraPrompt2);
        const resultSettingsAndComposition = extractTextFromResponse(returned);

        // // 3) ask for more creative settings as bullet point list 
        cameraPrompt1 = "give me 7 extraordinary and creative camera setting with explanation when i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : ". It can be creative and use of extra equipment.");

        // // 4) ask for more creative composition tips with equipment as bullet point list 
        cameraPrompt2 = "give me 7 extraordinary compositions with extra equipment and creative camera settings with explanation hen i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : ". Use different positions and angles.");
        const returnedCreative = await callVertexAIService(cameraPrompt1 + cameraPrompt2);
        const resultCreativeSettingsAndComposition = extractTextFromResponse(returnedCreative);

        // // 5) ask for things to avoid
        cameraPrompt1 = "give me 7 things to avoid and common mistakes with camera " + camera + (lens ? " and lens " + lens : ". I want to photograph the scenario " + scenario);
        const returnedAvoid = await callVertexAIService(cameraPrompt1);
        const resultAvoid = extractTextFromResponse(returnedAvoid);

        // // 6) create an image with 1) and 2)
        //TODO: implement image generation with vertex ai, aws or openai

        // // 7) create an image with 3) and 4)
        //TODO: implement image generation with vertex ai, aws or openai

        if (mail) {

            // 8) create pdf
            const pdfBase64 = await generatePDF(scenario, resultSettingsAndComposition, resultCreativeSettingsAndComposition, resultAvoid);

            //DEBUG 
            //const content = await generateHTML(scenario, resultSettings, resultComposition, resultCreativeSettings, resultCreativeComposition, resultAvoid);

            // send mail
            await sendMail(mail, pdfBase64);

            res.status(200).send({ message: "process finished" });
        }
        else {
            // create json
            const json = await generateJSON(scenario, resultSettingsAndComposition, resultCreativeSettingsAndComposition, resultAvoid);

            // return json
            res.status(200).json({ success: true, data: json });
        }
    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error during prediction:", error);
        console.error("scenario: ", scenario);
        console.error("camera: ", camera);
        console.error("lens: ", lens || "-");

        await saveData(scenario, camera, lens, mail);

        // Send back an error response
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

function extractTextFromResponse(response) {
    const result = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "-";
    const finishReason = response.candidates?.[0]?.finish_reason ?? "-";

    if(result == "-")
        throw new Error("invalid response: " + response);

    if(finishReason != "STOP")
        throw new Error("invalid finish reason: " + response);

    return result;
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
