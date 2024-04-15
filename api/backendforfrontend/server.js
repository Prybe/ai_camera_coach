// Import necessary libraries

const express = require('express');
const app = express();
const { accessAllowed, saveData } = require('./gatekeeper');

// Middleware to parse JSON bodies
app.use(express.json());

// Enabling CORS for all requests
const cors = require('cors');
app.use(cors());

// ping with gatekeeper
app.get('/api/ping', async (req, res) => {
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
app.post('/api/assistme', async (req, res) => {
    try {
        const { scenario, camera, lens, mail } = req.body;

        if (!scenario || !camera) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters. Please ensure 'scenario' and 'camera', are provided. 'lens' and 'mail' are optional."
            });
        }

        if (await !accessAllowed()) {
            return res.status(400).json({
                success: false,
                message: "Maximum number of daily calls reached. Try it tomorrow."
            });
        }

        await saveData(scenario, camera, lens, mail);

        // send json
        res.status(200).json({ success: true });

    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error during prediction:", error);

        // Send back an error response
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
