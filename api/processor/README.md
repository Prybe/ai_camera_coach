# ai_camera_coach processor

## Processor: ##
### api endpoint: /api/vertex ### 
port: 3000
Method: POST

1) Validating input variables.
2) Process data with vertex ai.
3) Use markdown output and convert to html.
4) Return json data with markdown and converted html.

### api endpoint: /api/process ### 
port: 3000
Method: GET

1) Read josn file from storage bucket.
2) Process data with vertex ai.
3) Use markdown output and convert to html.
4) Create html with template.
5) Send email with pdf attachment to brevo endpoint via nodemailer.
