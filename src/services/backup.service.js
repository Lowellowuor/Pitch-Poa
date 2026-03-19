const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');
const execPromise = util.promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_PATH || 'backups/';
    this.retentionDays = 30;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      this.initialized = true;
      logger.info(Backup service initialized. Backup directory: );
    } catch (error) {
      logger.error('Failed to initialize backup service:', error);
      throw error;
    }
  }

  async createBackup() {
    try {
      await this.initialize();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, ackup-);
      
      logger.info(Starting backup to: );
      
      // Ensure backup directory exists
      await fs.mkdir(backupPath, { recursive: true });

      // Backup database
      await this.backupDatabase(backupPath);
      
      // Backup uploads
      await this.backupUploads(backupPath);
      
      // Backup configurations
      await this.backupConfigs(backupPath);

      // Compress backup
      const compressedFile = await this.compressBackup(backupPath);

      // Clean old backups
      await this.cleanOldBackups();

      logger.info(Backup created successfully: );
      
      return { 
        success: true, 
        path: compressedFile,
        size: await this.getFileSize(compressedFile)
      };
    } catch (error) {
      logger.error('Backup failed:', error);
      throw error;
    }
  }

  async backupDatabase(backupPath) {
    const { MONGODB_URI } = process.env;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }
    
    const dbName = MONGODB_URI.split('/').pop().split('?')[0];
    
    logger.info(Backing up database: );
    
    await execPromise(mongodump --uri="" --out="/database");
    logger.info(Database backup completed: );
  }

  async backupUploads(backupPath) {
    const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
    
    try {
      await fs.access(uploadDir);
      await execPromise(cp -r  /uploads);
      logger.info('Uploads backup completed');
    } catch (error) {
      logger.warn('No uploads directory to backup');
    }
  }

  async backupConfigs(backupPath) {
    const configFiles = ['.env', 'ecosystem.config.js', 'package.json'];
    
    for (const file of configFiles) {
      try {
        await fs.access(file);
        await fs.copyFile(file, ${backupPath}/);
        logger.debug(Backed up config: );
      } catch (error) {
        logger.warn(Config file not found: );
      }
    }
  }

  async compressBackup(backupPath) {
    const compressedFile = ${backupPath}.tar.gz;
    
    logger.info(Compressing backup to: );
    
    // Get the base name of the backup directory
    const backupDirName = path.basename(backupPath);
    const parentDir = path.dirname(backupPath);
    
    await execPromise(	ar -czf  -C  );
    
    // Remove uncompressed directory
    await fs.rm(backupPath, { recursive: true, force: true });
    
    logger.info('Backup compressed successfully');
    
    return compressedFile;
  }

  async cleanOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const now = Date.now();
      const maxAge = this.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (!file.endsWith('.tar.gz')) continue;
        
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          logger.info(Deleted old backup: );
        }
      }
    } catch (error) {
      logger.error('Failed to clean old backups:', error);
    }
  }

  async restoreBackup(backupFile) {
    try {
      await this.initialize();
      
      const backupPath = path.join(this.backupDir, backupFile);
      
      // Check if backup exists
      try {
        await fs.access(backupPath);
      } catch {
        throw new Error(Backup file not found: );
      }
      
      logger.info(Restoring from backup: );
      
      // Extract backup
      await execPromise(	ar -xzf  -C );
      
      const extractedDir = backupPath.replace('.tar.gz', '');
      
      // Restore database
      await execPromise(mongorestore --uri="" --drop "/database");
      
      // Restore uploads
      const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
      await execPromise(cp -r /uploads/*  2>nul || exit 0);
      
      // Clean up extracted files
      await fs.rm(extractedDir, { recursive: true, force: true });
      
      logger.info(Restore completed from: );
      
      return { 
        success: true, 
        message: Restored from  
      };
    } catch (error) {
      logger.error('Restore failed:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      await this.initialize();
      
      const files = await fs.readdir(this.backupDir);
      const backups = [];
      
      for (const file of files) {
        if (!file.endsWith('.tar.gz')) continue;
        
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        });
      }
      
      // Sort by modified date, newest first
      return backups.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      logger.error('Failed to list backups:', error);
      throw error;
    }
  }

  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}

module.exports = new BackupService();
