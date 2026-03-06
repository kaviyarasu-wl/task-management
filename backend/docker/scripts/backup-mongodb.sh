#!/bin/bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/mongodb-backup-${TIMESTAMP}"
ARCHIVE_NAME="mongodb-backup-${TIMESTAMP}.gz"

echo "Starting MongoDB backup: ${TIMESTAMP}"

mongodump \
  --uri="${MONGODB_URI}" \
  --out="${BACKUP_DIR}" \
  --gzip

tar -czf "/tmp/${ARCHIVE_NAME}" -C "${BACKUP_DIR}" .

# Upload to S3 (requires aws-cli)
if [ -n "${S3_BACKUP_BUCKET:-}" ]; then
  aws s3 cp "/tmp/${ARCHIVE_NAME}" "s3://${S3_BACKUP_BUCKET}/mongodb/${ARCHIVE_NAME}"
  echo "Backup uploaded to S3: ${ARCHIVE_NAME}"
fi

# Cleanup
rm -rf "${BACKUP_DIR}" "/tmp/${ARCHIVE_NAME}"
echo "Backup completed: ${ARCHIVE_NAME}"
