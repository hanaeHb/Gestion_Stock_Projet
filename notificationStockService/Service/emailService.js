const nodemailer = require("nodemailer");

// Configure transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",      
    port: 587,
    secure: false,
    auth: {
        user: "admingostock@gmail.com",   
        pass: "kojirkxjzeizjheq"         
    }
});

// Function to send email
const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: '"GoStock APP" <votreemail@gmail.com>',
            to,
            subject,
            text
        });
        console.log(`Email envoyé à ${to}`);
    } catch (err) {
        console.error("Erreur sending email:", err);
    }
};

module.exports = { sendEmail };