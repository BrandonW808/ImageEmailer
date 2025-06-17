// upload.js
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

const storage = new Storage({
   projectId: process.env.GCP_PROJECT_ID,
   keyFilename: process.env.GCS_KEYFILE_PATH, // Add your keyfile path here
});

const bucketName = process.env.GCS_BUCKET_NAME;

export const uploadImage = async (file) => {
   const bucket = storage.bucket(bucketName);
   const blob = bucket.file(file.originalname);
   const blobStream = blob.createWriteStream();

   blobStream.end(file.buffer);

   await new Promise((resolve, reject) => {
      blobStream.on('finish', resolve);
      blobStream.on('error', reject);
   });

   await blob.makePublic();

   return `https://storage.googleapis.com/${bucketName}/${file.originalname}`;
};