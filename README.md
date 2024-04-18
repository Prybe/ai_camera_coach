# ai_camera_coach
AI helps you in photography

# Development

## Step 1:
a) Create a google project.
b) Activate vertex ai api.
c) Create a service account with role "vertex ai service".
d) Create a storage bucket.

e) Setup a .env file that contains variables. see .sample_env_file
- PROJECT_ID=<your google project id>
- LOCATION=<model location like europe-west3>
- MODEL_ID=<modelId like gemini-1.0-pro-vision-001>
- GOOGLE_APPLICATION_CREDENTIALS=<name of your service account file for local development>
- BREVO_MAIL=<brevo user login>
- BREVO_API_KEY=<brevo api key>
- BREVO_SENDER=<mail adress as sender>
- OPENAI_API_KEY=<checked but not used openai api key>
- GOOGLE_BUCKET_NAME=<name of your google bucket for gatekeeper functionality>
- GOOGLE_BUCKET_GATEKEEPER_FILENAME=<name of your gatekeeper json file for storing credits>

f) Create service account which is used to access the storage account and the vertex ai api.
   It can also be used for CloudRun to run the images in the cloud.

A google service account json file must be created in the google developer console with permission role of "vertex ai service".
This file is placed like .env in the root folder and copied in docker build process to your image.
Authentication process happens during startup.

## Step 2:
docker-compose build --no-cache
docker-compose up

## Step 3:
Use f.e. Postman to communicate with your service running in docker.

For local testing the vertex ai:

POST http://localhost:3010/api/vertex
Add Header Content-Type=application/json
Create a json body f.e.
{
  "scenario": "two cats playing at home. it is 2pm. sunny day.",
  "camera": "sony a6300",
  "lens": "",
  "mail": "john@doe.com"
}

The content will be returned as json.