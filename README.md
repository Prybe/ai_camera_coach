# ai_camera_coach
AI helps you in photography

# Development

## Step 1:
a) Create a google project.
b) Activate vertex ai api.
c) Create a service account with role "vertex ai service".

d) Setup a .env file that contains 4 variables. see .sample_env_file
- PROJECT_ID=<your google project id>
- LOCATION=<model location like europe-west3>
- MODEL_ID=<model id like gemini-1.0-pro-vision-001>
- GOOGLE_APPLICATION_CREDENTIALS=<name of your service account file>

A google service account json file must be created in the google developer console with permission role of "vertex ai service".
This file is placed like .env in the root folder and copied in docker build process to your image.
Authentication process happens during startup.

## Step 2:
docker build -t <your image name> .
docker-compose up

## Step 3:
Use f.e. Postman to communicate with your service running in docker.

POST http://localhost:3000/predict
Add Header Content-Type=application/json
Create a json body f.e.
{
  "param1": "write one sentence about iphone 15",
  "param2": "value2",
  "param3": "value3",
  "param4": "value4"
}
