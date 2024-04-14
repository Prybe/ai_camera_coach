# ai_camera_coach
AI helps you in photography

# Development

## Step 1:
a) Create a google project.
b) Activate vertex ai api.
c) Create a service account with role "vertex ai service".

d) Setup a .env file that contains 12 variables. see .sample_env_file
- PROJECT_ID=<your google project id>
- LOCATION=<model location like europe-west3>
- MODEL_ID=<modelId like gemini-1.0-pro-vision-001>
- MODEL_ID_VISION=<checked but not used - modelId like gemini-1.0-pro-vision-001>
- GOOGLE_APPLICATION_CREDENTIALS=<name of your service account file for local development>
- BREVO_MAIL=<brevo user login>
- BREVO_API_KEY=<brevo api key>
- BREVO_SENDER=<mail adress as sender>
- OPENAI_API_KEY=<checked but not used openai api key>
- GOOGLE_BUCKET_NAME=<name of your google bucket for gatekeeper functionality>
- GOOGLE_BUCKET_GATEKEEPER_FILENAME=<name of your gatekeeper json file for storing credits>
- GOOGLE_BUCKET_IMAGE_FILENAME=<name of your gatekeeper image file for website usage>

A google service account json file must be created in the google developer console with permission role of "vertex ai service".
This file is placed like .env in the root folder and copied in docker build process to your image.
Authentication process happens during startup.

## Step 2:
docker build -t <your image name> .
docker-compose up

## Step 3:
Use f.e. Postman to communicate with your service running in docker.

POST http://localhost:3000/assistme
Add Header Content-Type=application/json
Create a json body f.e.
{
  "scenario": "two cats playing at home. it is 2pm. sunny day.",
  "camera": "sony a6300",
  "lens": "",
  "mail": "john@doe.com"
}

If no mail if given the result will be the content as json.