import express from 'express';
import multer from 'multer';
import { uploadImage } from './upload.js';
import { 
   sendEmail, 
   sendEmailWithEmbeddedImage, 
   sendEmailWithAttachment,
   sendEmailWithBase64Image 
} from './email.js';
import { getErrorMessage } from './error.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();
const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({
   storage: storage,
   fileFilter: (req, file, cb) => {
      // Add proper file validation to ensure only images are uploaded
      if (file.mimetype.startsWith('image/')) {
         cb(null, true);
      } else {
         cb(new Error('Only images allowed!'));
      }
   },
   limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
   }
});

/**
 * Upload image and get URL (original functionality)
 */
app.post('/upload', upload.single('image'), async (req, res) => {
   try {
      if (!req.file) {
         res.status(400).send('No file uploaded.');
         return;
      }
      const imageUrl = await uploadImage(req.file);
      res.status(200).send({ imageUrl });
   } catch (error) {
      res.status(500).send({ error: getErrorMessage(error) });
   }
});

/**
 * Send email with external image URL (legacy - may trigger security warnings)
 */
app.post('/send-email', async (req, res) => {
   try {
      const { to, subject, imageUrl } = req.body;
      
      if (!to || !subject || !imageUrl) {
         return res.status(400).send({ error: 'Missing required fields: to, subject, imageUrl' });
      }
      
      const info = await sendEmail(to, subject, imageUrl);
      res.status(200).send({ 
         success: true, 
         messageId: info.messageId,
         warning: 'External images may be blocked by email clients' 
      });
   } catch (error) {
      res.status(500).send({ error: getErrorMessage(error) });
   }
});

/**
 * Send email with embedded image (recommended - no security warnings)
 * Upload image directly and embed it in the email
 */
app.post('/send-email-embedded', upload.single('image'), async (req, res) => {
   try {
      if (!req.file) {
         return res.status(400).send({ error: 'No image file uploaded.' });
      }
      
      const { to, subject } = req.body;
      
      if (!to || !subject) {
         return res.status(400).send({ error: 'Missing required fields: to, subject' });
      }
      
      const info = await sendEmailWithEmbeddedImage(
         to, 
         subject, 
         req.file.buffer, 
         req.file.originalname,
         req.file.mimetype
      );
      
      res.status(200).send({ 
         success: true, 
         messageId: info.messageId,
         method: 'embedded' 
      });
   } catch (error) {
      res.status(500).send({ error: getErrorMessage(error) });
   }
});

/**
 * Send email with image as attachment
 */
app.post('/send-email-attachment', upload.single('image'), async (req, res) => {
   try {
      if (!req.file) {
         return res.status(400).send({ error: 'No image file uploaded.' });
      }
      
      const { to, subject } = req.body;
      
      if (!to || !subject) {
         return res.status(400).send({ error: 'Missing required fields: to, subject' });
      }
      
      const info = await sendEmailWithAttachment(
         to, 
         subject, 
         req.file.buffer, 
         req.file.originalname,
         req.file.mimetype
      );
      
      res.status(200).send({ 
         success: true, 
         messageId: info.messageId,
         method: 'attachment' 
      });
   } catch (error) {
      res.status(500).send({ error: getErrorMessage(error) });
   }
});

/**
 * Send email with base64 inline image
 */
app.post('/send-email-base64', upload.single('image'), async (req, res) => {
   try {
      if (!req.file) {
         return res.status(400).send({ error: 'No image file uploaded.' });
      }
      
      const { to, subject } = req.body;
      
      if (!to || !subject) {
         return res.status(400).send({ error: 'Missing required fields: to, subject' });
      }
      
      const info = await sendEmailWithBase64Image(
         to, 
         subject, 
         req.file.buffer,
         req.file.mimetype
      );
      
      res.status(200).send({ 
         success: true, 
         messageId: info.messageId,
         method: 'base64' 
      });
   } catch (error) {
      res.status(500).send({ error: getErrorMessage(error) });
   }
});

/**
 * Send email with image from URL (downloads and embeds the image)
 */
app.post('/send-email-from-url', async (req, res) => {
   try {
      const { to, subject, imageUrl } = req.body;
      
      if (!to || !subject || !imageUrl) {
         return res.status(400).send({ error: 'Missing required fields: to, subject, imageUrl' });
      }
      
      // Download the image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
         throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
         throw new Error('URL does not point to a valid image');
      }
      
      const imageBuffer = Buffer.from(await response.arrayBuffer());
      const imageName = imageUrl.split('/').pop() || 'image.jpg';
      
      // Send email with embedded image
      const info = await sendEmailWithEmbeddedImage(
         to, 
         subject, 
         imageBuffer, 
         imageName,
         contentType
      );
      
      res.status(200).send({ 
         success: true, 
         messageId: info.messageId,
         method: 'embedded-from-url' 
      });
   } catch (error) {
      res.status(500).send({ error: getErrorMessage(error) });
   }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
   res.status(200).send({ status: 'healthy' });
});

app.listen(port, () => {
   console.log(`Server is running on port ${port}`);
   console.log('Available endpoints:');
   console.log('  POST /upload - Upload image and get URL');
   console.log('  POST /send-email - Send email with external image URL (may be blocked)');
   console.log('  POST /send-email-embedded - Send email with embedded image (recommended)');
   console.log('  POST /send-email-attachment - Send email with image as attachment');
   console.log('  POST /send-email-base64 - Send email with base64 inline image');
   console.log('  POST /send-email-from-url - Download image from URL and embed it');
});
