const nodemailer = require("nodemailer");

const { MAIL_USER } = process.env;
const { MAIL_PASSWORD } = process.env;

const transport = nodemailer.createTransport({
  host: "smtp.meta.ua",
  port: 465,
  secure: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASSWORD,
  },
});

function sendEmail(message) {
  message["from"] = "vernihorai@meta.ua";

  return transport.sendMail(message);
}

module.exports = sendEmail;
