// Import necessary libraries

const express = require('express');
const app = express();
const { generatePDF, generateHTML, generateJSON } = require('./pdf');
const sendMail = require('./mail');
const { getData, saveData, deleteData } = require('./gatekeeper');
const { callVertexAIService } = require('./vertex');

// Middleware to parse JSON bodies
app.use(express.json());

// Enabling CORS for all requests
const cors = require('cors');
app.use(cors());


// Define the endpoint to handle POST requests
app.post('/api/vertex', async (req, res) => {
    try {
        const { scenario, camera, lens, mail } = req.body;

        if (!scenario || !camera) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters. Please ensure 'scenario' and 'camera', are provided. Values for 'lens' and 'mail' are optional."
            });
        }

        await processData(camera, scenario, lens, undefined, res);

    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error during prediction:", error);

        // Send back an error response
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// Define the endpoint to handle GET requests
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

        await processData(camera, scenario, lens, mail, res);

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


async function processData(camera, scenario, lens, mail, res) {
    let cameraPrompt1 = ""
    let cameraPrompt2 = ""

    //TODO: Currently ignored by the vertex ai api
    //const outputFormatPrompt = "The output format should be a point bullet point list in html."
    const outputFormatPrompt = "Add a divider for between both lists.";

    // 1) ask for camera settings as bullet point list 
    cameraPrompt1 = "Create a list with 7 camera settings with detailed explanation when i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : + ".");

    // // 2) ask for composition tips as bullet point list 
    cameraPrompt2 = "Create a list with 7 compositions with detailed explanation when i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : ".");
    const returned = await callVertexAIService(cameraPrompt1 + cameraPrompt2 + outputFormatPrompt);
    const resultSettingsAndComposition = extractTextFromResponse(returned);

    // // 3) ask for more creative settings as bullet point list 
    cameraPrompt1 = "Create a list with 7 unusual camera settings with detailed explanation when i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : ". It can be creative and use of extra equipment.");

    // // 4) ask for more creative composition tips with equipment as bullet point list 
    cameraPrompt2 = "Create a list with 7 unusual compositions with extra equipment with detailed explanation when i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : ".");
    const returnedCreative = await callVertexAIService(cameraPrompt1 + cameraPrompt2 + outputFormatPrompt);
    const resultCreativeSettingsAndComposition = extractTextFromResponse(returnedCreative);

    // // 5) ask for things to avoid
    cameraPrompt1 = "Create a list with 7 things to avoid and common mistakes with camera " + camera + (lens ? " and lens " + lens : ". I want to photograph the scenario " + scenario);
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
}

function extractTextFromResponse(response) {
    const result = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "-";
    const finishReason = response.candidates?.[0]?.finishReason ?? "-";

    if(result == "-")
        throw new Error("invalid response: " + JSON.stringify(response));

    if(finishReason != "STOP")
        throw new Error("invalid finish reason: " + JSON.stringify(response));

    return result;
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
