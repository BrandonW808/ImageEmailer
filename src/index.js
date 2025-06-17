import express from 'express';
import multer from 'multer';
import { uploadImage } from './upload.js';
import { sendEmail } from './email.js';
import { getErrorMessage } from './error.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json()); // Add this line to parse JSON bodies

const port = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({
   storage: storage,
   fileFilter: (req, file, cb) => {
      // Add proper file validation to ensure only images are uploaded
      if (file.mimetype.includes('image/')) {
         cb(null, true);
      } else {
         cb(new Error('Only images allowed!'));
      }
   }
});

app.post('/upload', upload.single('image'), async (req, res) => {
   try {
      if (!req.file) {
         res.status(400).send('No file uploaded.');
         return;
      }
      const imageUrl = await uploadImage(req.file);
      res.status(200).send({ imageUrl });
   } catch (error) {
      res.status(500).send(getErrorMessage(error));
   }
});

app.post('/send-email', async (req, res) => {
   try {
      const { to, subject, imageUrl } = req.body;
      const info = await sendEmail(to, subject, imageUrl);
      res.status(200).send(info);
   } catch (error) {
      res.status(500).send(getErrorMessage(error));
   }
});

app.listen(port, () => {
   console.log(`Server is running on port ${port}`);
});