// Import necessary libraries
const express = require('express');
const { PredictionServiceClient } = require('@google-cloud/aiplatform');
const app = express();

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

const generativeVisionModel = vertex_ai.getGenerativeModel({
    model: modelIdVision,
});

// Define the endpoint to handle POST requests
app.post('/predict', async (req, res) => {
    try {
        const { scenario, camera, lens, mail } = req.body;

        process.stdout.write(JSON.stringify(scenario));
        process.stdout.write(JSON.stringify(camera));
        process.stdout.write(JSON.stringify(lens));
        process.stdout.write(JSON.stringify(mail));

        if (!scenario || !camera || !mail) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters. Please ensure 'scenario', 'camera', and 'mail' are provided. 'lens' is optional."
              });
        }

        // interact with Vertex AI
        let cameraPrompt = ""

        // 1) ask for camera settings as bullet point list 
        cameraPrompt = "give me 5 important camera setting for camera " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario);
        const returnedSettings = await callVertexAIService(cameraPrompt);
        const resultSettings = extractTextFromResponse(returnedSettings);

        // 2) ask for composition tips as bullet point list 
        cameraPrompt = "give me 5 composition tips with camera " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario);
        // TODO: include resultSettings
        const returnedComposition = await callVertexAIService(cameraPrompt);
        const resultComposition = extractTextFromResponse(returnedComposition);

        // 3) ask for more creative settings as bullet point list 
        cameraPrompt = "give me 5 important extraordanary camera setting for camera " + camera + (lens ? " and lens " + lens : " which are unusual but creative. I want to have unique photos. I want to shoot the scenario " + scenario);
        const returnedCreativeSettings = await callVertexAIService(cameraPrompt);
        const resultCreativeSettings = extractTextFromResponse(returnedCreativeSettings);

        // 4) ask for more creative composition tips with equipment as bullet point list 
        // TODO: include resultCreativeSettings
        cameraPrompt = "give me 5 extraordanary composition tips with camera " + camera + (lens ? " and lens " + lens : ". I want to have unique photos. Extra equipment is also possible. I want to shoot the scenario " + scenario);
        const returnedCreativeComposition = await callVertexAIService(cameraPrompt);
        const resultCreativeComposition = extractTextFromResponse(returnedCreativeComposition);

        // 5) ask for things to avoid
        cameraPrompt = "give me 5 things to avoid and common mistakes with camera " + camera + (lens ? " and lens " + lens : ". I want to shoot the scenario " + scenario);
        const returnedAvoid = await callVertexAIService(cameraPrompt);
        const resultAvoid = extractTextFromResponse(returnedAvoid);
        
        // 6) create an image with 1) and 2)

        // 7) create an image with 3) and 4)

        // Construct and return the JSON response
        res.json({
            resultSettings,
            resultComposition,
            resultCreativeSettings,
            resultCreativeComposition,
            resultAvoid
        });
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

async function callVertexAIService(topic, camera, lens) {
    const req = {
        contents: [{ role: 'user', parts: [{ text: topic }] }],
    };

    const streamingResp = await generativeModel.generateContentStream(req);
    
    for await (const item of streamingResp.stream) {
        process.stdout.write('stream chunk: ' + JSON.stringify(item));
    }

    const result = await streamingResp.response;

    process.stdout.write('aggregated response: ' + JSON.stringify(result));

    return result;
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
