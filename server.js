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

if (!projectId || !location || !modelId) {
    console.error('Error: The environment variables PROJECT_ID, MODELID and LOCATION must be set.');
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

// Define the endpoint to handle POST requests
app.post('/predict', async (req, res) => {
    try {
        const { param1, param2, param3, param4 } = req.body;

        process.stdout.write(JSON.stringify(param1));
        process.stdout.write(JSON.stringify(param2));

        // interact with Vertex AI
        const result = await callVertexAIService2(param1, param2);

        // Construct and return the JSON response
        res.json({
            result
        });
    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error during prediction:", error);

        // Send back an error response
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

async function callVertexAIService2(param1, param2) {
    const req = {
        contents: [{ role: 'user', parts: [{ text: param1 }] }],
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
