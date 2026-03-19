const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Custom error class for upload errors
class UploadError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'UploadError';
    this.statusCode = statusCode;
  }
}

// configuration - should be in environment variables
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 5 * 1024 * 1024, // 5MB default
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
  MAX_FILES_PER_REQUEST: 10,
  UPLOAD_PATH: process.env.UPLOAD_STORAGE_PATH || path.join(__dirname, '../../../uploads'),
};

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_CONFIG.UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_CONFIG.UPLOAD_PATH, { recursive: true, mode: 0o755 });
}

/**
 * Generate secure filename to prevent path traversal attacks
 */
const generateSecureFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  const extension = path.extname(originalname).toLowerCase();
  
  // Sanitize original filename - remove any path traversal attempts
  const sanitized = path.basename(originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${timestamp}-${randomString}${extension}`;
};

/**
 * storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create user-specific subdirectory if user is authenticated
    let uploadPath = UPLOAD_CONFIG.UPLOAD_PATH;
    
    if (req.user && req.user.id) {
      uploadPath = path.join(UPLOAD_CONFIG.UPLOAD_PATH, req.user.id);
      
      // Create user directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
      }
    }
    
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    try {
      const secureFilename = generateSecureFilename(file.originalname);
      
      // Store original filename in request for reference
      if (!req.uploadedFiles) req.uploadedFiles = [];
      req.uploadedFiles.push({
        originalName: file.originalname,
        secureName: secureFilename,
        mimeType: file.mimetype,
        size: 0, // Will be updated after save
      });
      
      cb(null, secureFilename);
    } catch (error) {
      cb(new UploadError('Error generating filename', 500));
    }
  },
});

/**
 * File filter for security validation
 */
const fileFilter = (req, file, cb) => {
  try {
    // Check file size (additional check beyond multer's limits)
    if (req.headers['content-length'] && 
        parseInt(req.headers['content-length']) > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      return cb(new UploadError(`File too large. Maximum size is ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`, 400));
    }

    // Check MIME type
    if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new UploadError(`File type not allowed. Allowed types: ${UPLOAD_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`, 400));
    }

    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (!UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
      return cb(new UploadError(`File extension not allowed. Allowed extensions: ${UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`, 400));
    }

    // Check for malicious content in filename
    const sanitized = path.basename(file.originalname);
    if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
      return cb(new UploadError('Invalid filename detected', 400));
    }

    cb(null, true);
  } catch (error) {
    cb(new UploadError('Error validating file', 500));
  }
};

/**
 * Production multer configuration
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    files: UPLOAD_CONFIG.MAX_FILES_PER_REQUEST,
    fields: 20, // Max number of non-file fields
  },
});

/**
 * Middleware to handle single file upload
 */
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Handle multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new UploadError(`File too large. Maximum size is ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`, 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new UploadError(`Too many files. Maximum is ${UPLOAD_CONFIG.MAX_FILES_PER_REQUEST}`, 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new UploadError('Unexpected field name', 400));
        }
        return next(new UploadError(err.message, 400));
      } else if (err) {
        // Handle custom errors
        return next(err);
      }
      
      // Add file info to request for logging
      if (req.file) {
        req.fileInfo = {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path,
        };
        
        // Log upload for monitoring
        console.info('File uploaded successfully', {
          filename: req.file.filename,
          size: req.file.size,
          userId: req.user?.id,
          endpoint: req.path,
        });
      }
      
      next();
    });
  };
};

/**
 * Middleware to handle multiple file uploads
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new UploadError(`File too large. Maximum size is ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`, 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new UploadError(`Too many files. Maximum is ${maxCount}`, 400));
        }
        return next(new UploadError(err.message, 400));
      } else if (err) {
        return next(err);
      }
      
      // Log multiple uploads
      if (req.files && req.files.length > 0) {
        console.info('Multiple files uploaded', {
          count: req.files.length,
          userId: req.user?.id,
          endpoint: req.path,
        });
      }
      
      next();
    });
  };
};

/**
 * Middleware to handle upload fields (mix of files and fields)
 */
const uploadFields = (fields) => {
  return (req, res, next) => {
    const fieldsUpload = upload.fields(fields);
    
    fieldsUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return next(new UploadError(err.message, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

/**
 * Utility to delete uploaded file
 */
const deleteUploadedFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
  return false;
};

/**
 * Utility to get file URL
 */
const getFileUrl = (req, filename) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

/**
 * Cleanup old/temp files (can be run as a cron job)
 */
const cleanupOldFiles = async (hoursOld = 24) => {
  try {
    const files = fs.readdirSync(UPLOAD_CONFIG.UPLOAD_PATH);
    const now = Date.now();
    const maxAge = hoursOld * 60 * 60 * 1000;
    
    let deleted = 0;
    
    files.forEach(file => {
      const filePath = path.join(UPLOAD_CONFIG.UPLOAD_PATH, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > maxAge) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    });
    
    console.info(`Cleaned up ${deleted} old files`);
  } catch (error) {
    console.error('Error cleaning up files:', error);
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteUploadedFile,
  getFileUrl,
  cleanupOldFiles,
  UPLOAD_CONFIG,
};