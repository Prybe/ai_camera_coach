const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
    process.env.OAUTH2_GMAIL_CLIENT_ID,
    process.env.OAUTH2_GMAIL_CLIENT_SECRET,
    process.env.OAUTH2_GMAIL_REDIRECTURL
);

// Generate a URL for users to grant your app access
const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly' // If you also want read access
  ];

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // Needed to receive a refresh token
    scope: scopes,
});

async function sendEmail(emailadress, pdfContent) {

    const {tokens} = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const accessToken = (await oAuth2Client.getAccessToken()).token;

    // Create a transporter
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.OAUTH2_GMAIL_ADRESS,
            clientId: process.env.OAUTH2_GMAIL_CLIENT_ID,
            clientSecret: process.env.OAUTH2_GMAIL_CLIENT_SECRET,
            refreshToken: process.env.OAUTH2_GMAIL_REFRESHTOKEN,
            accessToken: accessToken,
        },
        tls: {
            rejectUnauthorized: false // Only use this for testing purposes
        },
    });

    // Email options
    let mailOptions = {
        from: process.env.OAUTH2_GMAIL_ADRESS,
        to: emailadress,
        subject: 'Your Camera Settings',
        text: 'Please find attached the whitepaper with the settings for your equipment and scenario.',
        attachments: [{
            filename: 'camera-assistant.pdf',
            content: pdfContent,
            encoding: 'base64'
        }]
    };

    // Send the email
    try {
        let info = await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = sendEmail;