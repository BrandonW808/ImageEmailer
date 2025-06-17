import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send email with embedded image using CID reference
 * This method embeds the image directly in the email to avoid external loading prompts
 */
export const sendEmailWithEmbeddedImage = async (to, subject, imageBuffer, imageName, mimeType) => {
  // Generate a unique CID for the image
  const imageCid = `image-${Date.now()}@company.com`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: to,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
          <h1>Hello!</h1>
          <p>Here is the image you requested:</p>
          <!-- Using CID reference for embedded image -->
          <img src="cid:${imageCid}" alt="Embedded Image" style="max-width: 100%; height: auto; display: block; margin: 20px 0;">
          <p>Best regards,<br>Your Company</p>
        </body>
      </html>
    `,
    attachments: [
      {
        filename: imageName || 'image.jpg',
        content: imageBuffer,
        cid: imageCid, // Same CID as referenced in the HTML
        contentType: mimeType || 'image/jpeg'
      }
    ]
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send email with image as a regular attachment
 * User can view the image by opening the attachment
 */
export const sendEmailWithAttachment = async (to, subject, imageBuffer, imageName, mimeType) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: to,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
          <h1>Hello!</h1>
          <p>Your requested image is attached to this email.</p>
          <p>Please find the image in the attachments section.</p>
          <p>Best regards,<br>Your Company</p>
        </body>
      </html>
    `,
    attachments: [
      {
        filename: imageName || 'image.jpg',
        content: imageBuffer,
        contentType: mimeType || 'image/jpeg'
      }
    ]
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send email with base64 encoded inline image
 * Alternative method using data URI
 */
export const sendEmailWithBase64Image = async (to, subject, imageBuffer, mimeType) => {
  const base64Image = imageBuffer.toString('base64');
  const dataUri = `data:${mimeType || 'image/jpeg'};base64,${base64Image}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: to,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
          <h1>Hello!</h1>
          <p>Here is the image you requested:</p>
          <!-- Using base64 encoded image -->
          <img src="${dataUri}" alt="Inline Image" style="max-width: 100%; height: auto; display: block; margin: 20px 0;">
          <p>Best regards,<br>Your Company</p>
        </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Legacy method - Send email with external image URL (not recommended)
 * Kept for backward compatibility
 */
export const sendEmail = async (to, subject, imageUrl) => {
  console.warn('Using external image URLs in emails may trigger security warnings. Consider using sendEmailWithEmbeddedImage instead.');
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: to,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
          <h1>Hello!</h1>
          <p>Here is the image you requested:</p>
          <img src="${imageUrl}" alt="Uploaded Image" style="max-width: 100%; height: auto; display: block; margin: 20px 0;">
          <p>Note: You may need to enable external images in your email client to view this image.</p>
          <p>Best regards,<br>Your Company</p>
        </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
};
