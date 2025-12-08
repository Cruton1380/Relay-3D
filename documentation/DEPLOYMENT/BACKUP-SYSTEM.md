# Backup System Documentation

## Overview

The Relay Network includes a comprehensive backup system that creates timestamped backups of all critical data, ensuring data integrity and disaster recovery capabilities.

## Backup Components

### What Gets Backed Up

The backup system captures all critical data from the `data/` directory:

1. **Blockchain Data** (`data/blockchain/`)
   - `chain.jsonl`: Complete blockchain transaction history
   - `nonces.jsonl`: Nonce tracking for transaction integrity

2. **Voting Data** (`data/voting/`)
   - `session-votes.json`: Current session vote data
   - Vote persistence files and checksums

3. **Security Data** (`data/security/`)
   - `group-signal-sessions.json`: Signal Protocol group sessions
   - `signal-keys.json`: Cryptographic keys and key material
   - `signal-sessions.json`: Individual Signal Protocol sessions

4. **User Data** (`data/users/`)
   - `users.json`: User account information
   - `invites.json`: Invitation system data

5. **System Configuration** (`data/system/`)
   - `config.json`: System configuration and settings

6. **Additional Data**
   - `biometric-encryption-key.dat`: Biometric encryption keys
   - `sender-keys.json`: Sender key material
   - Regional and proximity data
   - Channel and demo data

## Backup Location

Backups are stored in the `backups/` directory with the following structure:

```
backups/
├── backup-2025-09-18T16-08-34-266Z/
│   ├── backup-manifest.json
│   ├── blockchain/
│   │   ├── chain.jsonl
│   │   └── nonces.jsonl
│   ├── voting/
│   │   └── session-votes.json
│   ├── security/
│   │   ├── group-signal-sessions.json
│   │   ├── signal-keys.json
│   │   └── signal-sessions.json
│   ├── users/
│   │   ├── users.json
│   │   └── invites.json
│   └── system/
│       └── config.json
├── backup-2025-09-18T15-30-12-123Z/
└── ...
```

## Running Backups

### Manual Backup

```bash
# Run a single backup
npm run backup:data

# Or run the script directly
node scripts/backup-data.mjs
```

### Automated Backups

The backup system includes automatic rotation to prevent disk space issues:

- **Retention Policy**: Keeps the last 7 backups by default
- **Automatic Cleanup**: Older backups are automatically deleted
- **Configurable**: Retention count can be adjusted in the script

## Backup Manifest

Each backup includes a `backup-manifest.json` file with metadata:

```json
{
  "timestamp": "2025-09-18T16:08:34.266Z",
  "backupPath": "/path/to/backup-2025-09-18T16-08-34-266Z",
  "projectRoot": "/path/to/RelayCodeBaseV57",
  "dataDirectory": "/path/to/RelayCodeBaseV57/data",
  "results": [
    {
      "name": "blockchain-data",
      "description": "Blockchain transaction data",
      "status": "success",
      "path": "/path/to/backup/blockchain"
    }
  ],
  "summary": {
    "total": 5,
    "successful": 5,
    "failed": 0
  }
}
```

## Backup Script Features

### Comprehensive Logging
- Timestamped log entries for all operations
- Success/failure tracking for each data component
- Detailed error reporting with context

### Error Handling
- Graceful handling of missing directories
- Individual component failure doesn't stop the entire backup
- Detailed error reporting in manifest

### Performance Optimizations
- Parallel directory copying where possible
- Efficient file system operations
- Minimal memory usage for large datasets

## Integration with System Maintenance

The backup system integrates with the broader system maintenance framework:

```bash
# Full system maintenance (includes backup)
npm run maintenance:backup

# Individual maintenance operations
npm run maintenance:reset      # Reset system state
npm run maintenance:clear-cache # Clear caches
npm run maintenance:validate   # Validate system integrity
npm run maintenance:fix        # Fix common issues
```

## Security Considerations

### Sensitive Data Handling
- **Encryption Keys**: Cryptographic keys are backed up but should be handled securely
- **User Data**: Personal information is included in backups
- **Access Control**: Backup directories should have restricted access permissions

### Backup Security
```bash
# Set secure permissions on backup directory
chmod 700 backups/
chmod 600 backups/*/backup-manifest.json
```

### Production Recommendations
1. **Encrypt Backups**: Consider encrypting backup files for additional security
2. **Offsite Storage**: Store backups in secure, offsite locations
3. **Access Logging**: Monitor access to backup files
4. **Regular Testing**: Periodically test backup restoration procedures

## Restoration Process

### Manual Restoration
```bash
# Stop the application
npm run stop

# Restore from backup
cp -r backups/backup-2025-09-18T16-08-34-266Z/* data/

# Restart the application
npm run dev:both
```

### Automated Restoration Script
```javascript
// Example restoration script
import fs from 'fs/promises';
import path from 'path';

async function restoreFromBackup(backupPath) {
  const dataDir = path.join(process.cwd(), 'data');
  
  // Stop application services
  console.log('Stopping application services...');
  
  // Clear current data
  await fs.rm(dataDir, { recursive: true, force: true });
  
  // Restore from backup
  await fs.cp(backupPath, dataDir, { recursive: true });
  
  console.log('Restoration complete');
}
```

## Monitoring and Alerts

### Backup Status Monitoring
The backup system provides detailed status information:

```bash
# Check backup status
npm run security:check
```

### Health Checks
- **Backup Completeness**: Verify all critical data is backed up
- **Backup Integrity**: Check backup file integrity
- **Storage Space**: Monitor available disk space
- **Retention Policy**: Ensure old backups are properly cleaned up

## Troubleshooting

### Common Issues

**Q: Backup fails with "permission denied" error**
A: Ensure the script has write permissions to the backups directory:
```bash
chmod 755 backups/
```

**Q: Backup takes too long**
A: Large datasets may take time. Consider excluding non-critical data or implementing incremental backups.

**Q: Backup manifest shows failures**
A: Check the specific error messages in the manifest. Some components may be optional.

**Q: How do I restore from a specific backup?**
A: Use the backup timestamp to identify the correct backup directory and copy its contents to the data directory.

### Error Codes
- **EACCES**: Permission denied - check file permissions
- **ENOENT**: File or directory not found - verify data directory exists
- **ENOSPC**: No space left on device - free up disk space
- **EIO**: Input/output error - check disk health

## Best Practices

### Regular Backups
- **Frequency**: Run backups before major updates or deployments
- **Automation**: Set up automated backups for production systems
- **Testing**: Regularly test backup restoration procedures

### Storage Management
- **Monitoring**: Monitor disk space usage
- **Rotation**: Ensure backup rotation is working correctly
- **Compression**: Consider compressing old backups to save space

### Documentation
- **Backup Logs**: Keep records of backup operations
- **Restoration Procedures**: Document restoration steps
- **Emergency Contacts**: Maintain contact information for backup-related issues

## Future Enhancements

### Planned Features
- **Incremental Backups**: Only backup changed files
- **Compression**: Automatic compression of backup files
- **Encryption**: Built-in backup encryption
- **Cloud Storage**: Integration with cloud storage providers
- **Backup Scheduling**: Built-in scheduling system
- **Differential Backups**: Track changes between backups

### Integration Opportunities
- **Database Backups**: Integration with database backup systems
- **Configuration Management**: Backup system configuration
- **Monitoring Integration**: Integration with system monitoring tools
- **Alert Systems**: Automated alerts for backup failures
