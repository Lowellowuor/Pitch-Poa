const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

class FileUploadService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_PATH || 'uploads/';
    this.maxSize = process.env.MAX_FILE_SIZE || 5 * 1024 * 1024;
    
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  // Configure multer for different file types
  getUploadMiddleware(options = {}) {
    const {
      fieldName = 'file',
      maxSize = this.maxSize,
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxFiles = 1
    } = options;

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        cb(null, ${Date.now()}-);
      }
    });

    const fileFilter = (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new ApiError(400, File type  not allowed), false);
      }
    };

    return multer({
      storage,
      limits: { fileSize: maxSize },
      fileFilter
    }).array(fieldName, maxFiles);
  }

  // Process and validate uploaded files
  async processUploadedFiles(files) {
    const processed = [];

    for (const file of files) {
      // Scan for malware (integration with antivirus service)
      await this.scanFile(file.path);

      // Generate thumbnail for images
      if (file.mimetype.startsWith('image/')) {
        file.thumbnail = await this.generateThumbnail(file.path);
      }

      // Encrypt sensitive documents
      if (this.isSensitiveDocument(file)) {
        file.encrypted = await this.encryptFile(file.path);
      }

      processed.push({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        thumbnail: file.thumbnail,
        encrypted: file.encrypted
      });
    }

    return processed;
  }

  async scanFile(filePath) {
    // Integrate with ClamAV or similar
    logger.info(Scanning file: );
    return true;
  }

  async generateThumbnail(filePath) {
    try {
      const sharp = require('sharp');
      const thumbnailPath = filePath.replace(/\.[^/.]+$/, '_thumb$&');
      
      await sharp(filePath)
        .resize(200, 200)
        .toFile(thumbnailPath);
      
      return thumbnailPath;
    } catch (error) {
      logger.error('Thumbnail generation failed:', error);
      return null;
    }
  }

  isSensitiveDocument(file) {
    const sensitiveTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return sensitiveTypes.includes(file.mimetype);
  }

  async encryptFile(filePath) {
    // Implement file encryption for sensitive documents
    return true;
  }

  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(Deleted file: );
    } catch (error) {
      logger.error(Failed to delete file: , error);
    }
  }

  async cleanupOldFiles(days = 30) {
    try {
      const files = await fs.readdir(this.uploadDir);
      const now = Date.now();
      const maxAge = days * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await this.deleteFile(filePath);
        }
      }
    } catch (error) {
      logger.error('Cleanup failed:', error);
    }
  }
}

module.exports = new FileUploadService();
