// Import necessary libraries
const express = require('express');
const { PredictionServiceClient } = require('@google-cloud/aiplatform');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize the Vertex AI prediction service client
const client = new PredictionServiceClient();

// Your Google Cloud project ID and location
const { VertexAI } = require('@google-cloud/vertexai');

const projectId = process.env.PROJECT_ID;
const location = process.env.LOCATION;
const modelId = process.env.MODELID;

if (!projectId || !location || modelId) {
    console.error('Error: The environment variables PROJECT_ID, MODELID and LOCATION must be set.');
    process.exit(1); // Exit the application if variables are not set
  }

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({ project: projectId, location: location });
const model = 'gemini-1.0-pro-vision-001';

// Example function to demonstrate making a call to the Vertex AI service
async function getPrediction(modelName, payload) {
    // The model name typically includes project, location, and model ID
    const name = client.modelPath(projectId, location, modelName);

    const request = {
        name: name,
        payload: payload,
    };

    const [response] = await client.predict(request);
    return response;
}

// Instantiate the models
const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
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
    const { param1, param2, param3, param4 } = req.body;

    // Example function calls to interact with Vertex AI
    const result1 = await callVertexAIService1(param1, param2);
    const result2 = await callVertexAIService2(param3, param4);

    // Construct and return the JSON response
    res.json({
        result1,
        result2
    });
});

// Example placeholder functions for Vertex AI service calls
async function callVertexAIService1(param1, param2) {
    const modelName = modelId; 
    const payload = {}; 
    
    getPrediction(modelName, payload)
        .then((response) => console.log(response))
        .catch((err) => console.error(err));
    return { dummyResult: 'Result from service 1' };
}

async function callVertexAIService2(param3, param4) {
    const req = {
        contents: [{ role: 'user', parts: [{ text: "create one sentence about sony a6300" }] }],
    };

    const streamingResp = await generativeModel.generateContentStream(req);

    for await (const item of streamingResp.stream) {
        process.stdout.write('stream chunk: ' + JSON.stringify(item));
    }

    process.stdout.write('aggregated response: ' + JSON.stringify(await streamingResp.response));

    return await streamingResp.response;
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
