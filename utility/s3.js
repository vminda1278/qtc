const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
});

// Support both S3_ASSETS_BUCKET (from serverless.yml) and S3_BUCKET_NAME (fallback)
const S3_BUCKET = process.env.S3_ASSETS_BUCKET || process.env.S3_BUCKET_NAME || 'qwiktax-assets-prod';

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @param {string} folder - S3 folder path (e.g., 'offices', 'team-members')
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadToS3(fileBuffer, fileName, mimeType, folder = 'uploads') {
    try {
        console.log('[S3] Starting upload:', {
            bucket: S3_BUCKET,
            fileName,
            folder,
            mimeType,
            region: process.env.AWS_REGION || 'us-east-1'
        });

        // Generate unique filename
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const key = `${folder}/${uniqueFileName}`;

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: fileBuffer,
            ContentType: mimeType,
            // ACL removed - using bucket policy for public access instead
        });

        await s3Client.send(command);

        // Return public URL
        const publicUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
        
        console.log('[S3] File uploaded successfully:', publicUrl);
        return publicUrl;

    } catch (error) {
        console.error('[S3] Upload error:', {
            message: error.message,
            code: error.code,
            bucket: S3_BUCKET,
            region: process.env.AWS_REGION,
            error: error
        });
        throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
}

/**
 * Upload multiple files to S3
 * @param {Array} files - Array of file objects with buffer, name, mimeType
 * @param {string} folder - S3 folder path
 * @returns {Promise<Array<string>>} - Array of public URLs
 */
async function uploadMultipleToS3(files, folder = 'uploads') {
    try {
        const uploadPromises = files.map(file => 
            uploadToS3(file.buffer, file.name, file.mimeType, folder)
        );
        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error('[S3] Multiple upload error:', error);
        throw new Error('Failed to upload files to S3');
    }
}

module.exports = {
    uploadToS3,
    uploadMultipleToS3,
    S3_BUCKET,
};
