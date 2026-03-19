#!/usr/bin/env node

const backupService = require('../src/services/backup.service');

async function main() {
  try {
    console.log('Starting backup...');
    const result = await backupService.createBackup();
    console.log('✅ Backup completed:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

main();
