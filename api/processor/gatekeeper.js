const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = process.env.GOOGLE_BUCKET_NAME;
const fileName_Gatekeeper = process.env.GOOGLE_BUCKET_GATEKEEPER_FILENAME;
const { v4: uuidv4 } = require('uuid');  // Importing the UUID v4 function

if (!bucketName || !fileName_Gatekeeper) {
    console.error('Error: The environment variables GOOGLE_BUCKET_NAME and GOOGLE_BUCKET_GATEKEEPER_FILENAME must be set.');
    process.exit(1); // Exit the application if variables are not set
}

// Function to get data from a Google Cloud Storage bucket
async function getData() {
    const bucket = storage.bucket(bucketName);

    try {
        // Get a list of files in the "jobs" folder
        const options = {
            prefix: 'jobs/',
            autoPaginate: false, 
            delimiter: '/',
            maxResults: 5,
        };

        const [files] = await bucket.getFiles(options);
        if (files.length === 0) {
            console.log('No files found in the "jobs" folder.');
            return null;
        }

        // Process each file
        for (const file of files) {
            if (file.name.startsWith('jobs') && file.name.endsWith('.json')) {
                // Get the first file from the list
                const fileName = file.name;
                const contents = await file.download();
                const contentsString = contents.toString('utf8');
            
                // Return the file name and its contents as a JSON object
                const data = JSON.parse(contentsString);
                return { fileName, data };
            }
        }

        return null;
    } catch (error) {
        console.error('Error retrieving file:', error);
        throw error;
    }
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

// Function to delete a file from a Google Cloud Storage bucket
async function deleteData(fileName) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    try {
        await file.delete();
        console.log(`File ${fileName} deleted successfully from bucket ${bucketName}.`);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

module.exports = {
    getData,
    saveData,
    deleteData
};