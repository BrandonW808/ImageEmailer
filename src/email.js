import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendEmail = async (to, subject, imageUrl) => {
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: to,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${subject}</title>
        </head>
        <body>
          <h1>Hello!</h1>
          <p>Here is the image you requested:</p>
          <img src="${imageUrl}" alt="Uploaded Image" style="max-width: 100%;">
          <p>Best regards,<br>Your Company</p>
        </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
};