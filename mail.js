const nodemailer = require('nodemailer');

async function sendEmail(emailadress, pdfContent) {

    // Create a transporter
    let transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.BREVO_MAIL, // Your SendinBlue email address
            pass: process.env.BREVO_API_KEY // Your SendinBlue SMTP API Key
        },
        tls: {
            rejectUnauthorized: false // Only use this for testing purposes
        },
        // Adjust the timeout setting
        connectionTimeout: 60000, // milliseconds
        greetingTimeout: 60000, // milliseconds
        socketTimeout: 60000,  // milliseconds
    });

    // Email options
    let mailOptions = {
        from: process.env.BREVO_MAIL,
        to: emailadress,
        subject: 'AI Camera Assistant Whitepaper',
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
        console.log("Mail sent.");
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = sendEmail;