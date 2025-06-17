import { uploadImage } from '../src/upload.js';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

// Mock Google Cloud Storage
jest.mock('@google-cloud/storage', () => {
    const mockFile = {
        createWriteStream: jest.fn().mockReturnValue({
            on: jest.fn().mockImplementation(function (event, callback) {
                if (event === 'finish') {
                    setTimeout(() => callback(), 0);
                }
                return this;
            }),
            end: jest.fn()
        }),
        makePublic: jest.fn()
    };

    const mockBucket = {
        file: jest.fn().mockReturnValue(mockFile)
    };

    return {
        Storage: jest.fn().mockImplementation(() => ({
            bucket: jest.fn().mockReturnValue(mockBucket)
        }))
    };
});

describe('uploadImage', () => {
    const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test')
    };

    beforeEach(() => {
        jest.clearAllMocks();
        dotenv.config({ path: '.env.test' });
    });

    test('should upload file and return public URL', async () => {
        const result = await uploadImage(mockFile);

        // expect(Storage).toHaveBeenCalledWith({
        //     projectId: process.env.GCP_PROJECT_ID,
        //     keyFilename: process.env.GCS_KEYFILE_PATH
        // });
        expect(result).toBe(
            `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/test.jpg`
        );
    });

    test('should handle upload errors', async () => {
        const mockError = new Error('Upload failed');
        const mockStream = Storage().bucket().file().createWriteStream();

        mockStream.on.mockImplementation((event, callback) => {
            if (event === 'error') {
                callback(mockError);
            }
            return mockStream;
        });

        await expect(uploadImage(mockFile)).rejects.toThrow(mockError);
    });

    test('should make file public after upload', async () => {
        await uploadImage(mockFile);
        const mockFileInstance = Storage().bucket().file();
        expect(mockFileInstance.makePublic).toHaveBeenCalled();
    });
});