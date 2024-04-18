
const { PredictionServiceClient } = require('@google-cloud/aiplatform');

// Your Google Cloud project ID and location
const { VertexAI } = require('@google-cloud/vertexai');

const projectId = process.env.PROJECT_ID;
const location = process.env.LOCATION;
const modelId = process.env.MODEL_ID;

if (!projectId || !location || !modelId) {
    console.error('Error: The environment variables PROJECT_ID, MODEL_ID and LOCATION must be set.');
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

async function callVertexAIService(topic) {
    const req = {
        contents: [{ role: 'user', parts: [{ text: topic }] }],
    };

    const streamingResp = await generativeModel.generateContentStream(req);
    const result = await streamingResp.response;

    return result;
}

module.exports = {
    callVertexAIService
  };