const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = process.env.GOOGLE_BUCKET_NAME;
const fileName_Gatekeeper = process.env.GOOGLE_BUCKET_GATEKEEPER_FILENAME;
const { v4: uuidv4 } = require('uuid');  // Importing the UUID v4 function

if (!bucketName || !fileName_Gatekeeper) {
    console.error('Error: The environment variables GOOGLE_BUCKET_NAME and GOOGLE_BUCKET_GATEKEEPER_FILENAME must be set.');
    process.exit(1); // Exit the application if variables are not set
}

// Function to save data to a Google Cloud Storage bucket
async function saveData(scenario, camera, lens, mail) {
    // The name of the bucket and the file
    const fileName = `jobs/${uuidv4()}.json`;  // Using UUID for filename

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

     // Construct the JSON data with handling for empty lens and mail
     const data = JSON.stringify({
        scenario,
        camera,
        lens: lens || null,  // Use null if lens is empty
        mail: mail || null   // Use null if mail is empty
    });

    // Options for the file
    const options = {
        resumable: false,
        metadata: {
            contentType: 'application/json',
        },
    };

    // Save the file to the bucket
    try {
        await file.save(data, options);
        console.log(`Data saved to ${fileName} in bucket ${bucketName}`);
    } catch (error) {
        console.error('Error saving file:', error);
        throw error;
    }
}

// Function to check and update access
async function accessAllowed() {
    const bucket = storage.bucket(bucketName);
    const file_Gatekeeper = bucket.file(fileName_Gatekeeper);

    try {
        // Try to download the file
        const [content] = await file_Gatekeeper.download();
        const data = JSON.parse(content.toString());

        // Get today's date in 'YYYY-MM-DD' format
        const today = new Date().toISOString().split('T')[0];
        
        if (data[today] && data[today] < 100) {
            // If the value is below 100, increment and write back
            data[today]++;
            await file_Gatekeeper.save(JSON.stringify(data), {resumable: false});

            return true;
        } else if (data[today] && data[today] >= 100) {
            // If the value is 100 or more, return false
            return false;
        } else {
            // If the key does not exist, create it with value 1
            data[today] = 1;
            await file_Gatekeeper.save(JSON.stringify(data), {resumable: false});

            return true;
        }
    } catch (error) {
        // If the file does not exist, create it with the key for today and value 1
        if (error.code === 404) {
            const today = new Date().toISOString().split('T')[0];
            const newData = {[today]: 1};
            await file.save(JSON.stringify(newData), {resumable: false});
            return true;
        } else {
            // Log any other error
            console.error('Error accessing the bucket:', error);
            throw error;
        }
    }
}

module.exports = {
    accessAllowed,
    saveData
};