#!/usr/bin/env node

const backupService = require('../src/services/backup.service');

async function main() {
  const backupFile = process.argv[2];
  
  if (!backupFile) {
    console.error('Please provide backup filename');
    console.log('Usage: npm run restore <backup-filename.tar.gz>');
    console.log('\nAvailable backups:');
    const backups = await backupService.listBackups();
    backups.forEach(b => console.log(  -  ( MB)));
    process.exit(1);
  }

  try {
    console.log(Restoring from backup: );
    const result = await backupService.restoreBackup(backupFile);
    console.log('✅ Restore completed:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  }
}

main();
