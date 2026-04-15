const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "admingostock@gmail.com",
        pass: "kojirkxjzeizjheq"
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: '"Notification Service" <your.email@gmail.com>',
            to,
            subject,
            text
        });

        console.log("Email sent: " + info.response);
    } catch (err) {
        console.error("Error sending email:", err.message);
    }
};

module.exports = { sendEmail };