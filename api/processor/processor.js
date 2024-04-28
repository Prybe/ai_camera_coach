// Import necessary libraries

const express = require('express');
const app = express();
const { generatePDF, generateJSON, generateHTML } = require('./pdf');
const sendMail = require('./mail');
const { getData, saveData, deleteData } = require('./gatekeeper');
const { callVertexAIService } = require('./vertex');
const path = require('path');
const fs = require('fs');

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
    const outputFormatPrompt = "The output format should be a point bullet point list."
    //const outputFormatPrompt = "";

    //Better results with 5 separate vertex ai calls relatex to token limits.
    //combine settings and compositions prompt results in a shorter output with less details.

    // 1) ask for camera settings as bullet point list 
    cameraPrompt1 = "Explain 5 camera settings with details when i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : + ".");

    // // 2) ask for composition tips as bullet point list 
    cameraPrompt2 = "Explain 5 compositions with details when i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : ".");
    const returned1 = await callVertexAIService(cameraPrompt1 + outputFormatPrompt);
    const returned2 = await callVertexAIService(cameraPrompt2 + outputFormatPrompt);
    const resultSettings = extractTextFromResponse(returned1);
    const resultComposition = extractTextFromResponse(returned2);

    // // 3) ask for more creative settings as bullet point list 
    cameraPrompt1 = "Explain 5 unusual camera settings with details when i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : ". Be creative and use of extra equipment.");

    // // 4) ask for more creative composition tips with equipment as bullet point list 
    cameraPrompt2 = "Explain 5 unusual compositions with extra equipment with details when i want to photograph " + scenario + " using a " + camera + (lens ? " and lens " + lens : ".");
    const returnedCreative1 = await callVertexAIService(cameraPrompt1 + outputFormatPrompt);
    const returnedCreative2 = await callVertexAIService(cameraPrompt2 + outputFormatPrompt);
    const resultCreativeSettings = extractTextFromResponse(returnedCreative1);
    const resultCreativeComposition = extractTextFromResponse(returnedCreative2);

    // // 5) ask for things to avoid
    cameraPrompt1 = "Create a list with 5 things to avoid and common mistakes with camera " + camera + (lens ? " and lens " + lens : ". I want to photograph the scenario " + scenario);
    const returnedAvoid = await callVertexAIService(cameraPrompt1 + outputFormatPrompt);
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

        res.status(200).send({ message: "process finished" });
    }
    else {
        // create json
        const json = await generateJSON(scenario, resultSettings, resultComposition, resultCreativeSettings, resultCreativeComposition, resultAvoid);

        //const pdfBase64 = await generatePDF(scenario, resultSettings, resultComposition, resultCreativeSettings, resultCreativeComposition, resultAvoid);
        const updatedHtml = await generateHTML(scenario, resultSettings, resultComposition, resultCreativeSettings, resultCreativeComposition, resultAvoid);

        const filePath = path.join(__dirname, 'data', 'output.html');
        fs.writeFile(filePath, updatedHtml, (err) => {
            if (err) {
              console.error('Error writing file:', err);
            } else {
              console.log('File has been written successfully');
            }
          });

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
