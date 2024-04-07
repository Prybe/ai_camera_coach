const { OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
  });
  
async function generateImage(prompt) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3", // Adjust based on the available image models and your subscription
      prompt: prompt,
      n: 1, // Number of images to generate
      size: "1024x1024" // Image size, adjust as needed
    });

    if (response.data && response.data.data.length > 0) {
      // Assuming the API returns a URL directly. Adjust based on the actual response structure.
      return response.data.data[0].url;
    } else {
        return "";
    }
  } catch (error) {
    console.error("Error generating image:", error);
    return "";
  }
}

module.exports = { generateImage };
