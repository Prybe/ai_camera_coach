const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
    process.env.OAUTH2_GMAIL_CLIENT_ID,
    process.env.OAUTH2_GMAIL_CLIENT_SECRET,
    process.env.OAUTH2_GMAIL_REDIRECTURL
);

oAuth2Client.setCredentials({
    refresh_token: process.env.OAUTH2_GMAIL_REFRESHTOKEN,
});

async function sendEmail(emailadress, pdfContent) {

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
    console.log("mail sent.");

    // Send the email
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = sendEmail;