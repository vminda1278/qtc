const multer = require('multer');
const { uploadToS3 } = require('../utility/s3');

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
        }
    }
});

/**
 * Upload single image
 * @route POST /v1/upload/image
 */
async function uploadImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const folder = req.body.folder || 'uploads'; // Default folder
        const { buffer, originalname, mimetype } = req.file;

        // Upload to S3
        const url = await uploadToS3(buffer, originalname, mimetype, folder);

        return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: url
            }
        });

    } catch (error) {
        console.error('Error in uploadImage:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload image',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

/**
 * Upload multiple images
 * @route POST /v1/upload/images
 */
async function uploadImages(req, res) {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const folder = req.body.folder || 'uploads';
        const uploadPromises = req.files.map(file => 
            uploadToS3(file.buffer, file.originalname, file.mimetype, folder)
        );

        const urls = await Promise.all(uploadPromises);

        return res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            data: {
                urls: urls
            }
        });

    } catch (error) {
        console.error('Error in uploadImages:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload images',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

module.exports = {
    upload,
    uploadImage,
    uploadImages
};
