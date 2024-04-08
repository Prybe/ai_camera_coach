const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = process.env.GOOGLE_BUCKET_NAME;
const fileName_Gatekeeper = process.env.GOOGLE_BUCKET_GATEKEEPER_FILENAME;
const fileName_Image = process.env.GOOGLE_BUCKET_IMAGE_FILENAME;
const { createImageWithText } = require('./image');

if (!bucketName || !fileName_Gatekeeper || !fileName_Image) {
    console.error('Error: The environment variables GOOGLE_BUCKET_NAME, GOOGLE_BUCKET_IMAGE_FILENAME and GOOGLE_BUCKET_GATEKEEPER_FILENAME must be set.');
    process.exit(1); // Exit the application if variables are not set
}

// Function to check and update access
async function accessAllowed() {
    const bucket = storage.bucket(bucketName);
    const file_Gatekeeper = bucket.file(fileName_Gatekeeper);
    const file_Image = bucket.file(fileName_Image);

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
         
            // create new image
            const text = 100 - data[today]; 
            const imageBuffer= await createImageWithText('Today ' + text +' calls left');
            // Upload the image buffer
            await file_Image.save(imageBuffer, {
                metadata: {
                  contentType: 'image/png', // Make sure to match this with the buffer's format
                },
              });

            return true;
        } else if (data[today] && data[today] >= 100) {
            // If the value is 100 or more, return false
          
            return false;
        } else {
            // If the key does not exist, create it with value 1
            data[today] = 1;
            await file_Gatekeeper.save(JSON.stringify(data), {resumable: false});
          
            // create new image
            const imageBuffer= await createImageWithText('Today 99 calls left');
            // Upload the image buffer
            await file_Image.save(imageBuffer, {
                metadata: {
                  contentType: 'image/png', // Make sure to match this with the buffer's format
                },
              });

            return true;
        }
    } catch (error) {
        // If the file does not exist, create it with the key for today and value 1
        if (error.code === 404) {
            const today = new Date().toISOString().split('T')[0];
            const newData = {[today]: 1};
            await file_Gatekeeper.save(JSON.stringify(newData), {resumable: false});
            
            const imageBuffer= await createImageWithText('Today 99 calls left');
            // Upload the image buffer
            await file_Image.save(imageBuffer, {
                metadata: {
                  contentType: 'image/png', // Make sure to match this with the buffer's format
                },
              });

            return true;
        } else {
            // Log any other error
            console.error('Error accessing the bucket:', error);
            return false;
        }
    }
}

module.exports = { accessAllowed };
