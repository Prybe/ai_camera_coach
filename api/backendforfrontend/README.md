# ai_camera_coach backend for frontend

## Backend for Frontend: ##
### api endpoint: /api/assistme ### 
port: 3000
Method: POST

1) Validating input variables
2) Validating access by checking the amount of calls today stored in storage bucket. Maximum 100.
3) Save data as json in storage bucket with UUID as filename.
