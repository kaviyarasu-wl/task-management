#!/bin/bash
set -euo pipefail

ARCHIVE_NAME="${1:-}"

if [ -z "${ARCHIVE_NAME}" ]; then
  echo "Usage: restore-mongodb.sh <archive-name>"
  echo "  archive-name: Name of the backup archive (e.g., mongodb-backup-20240101_120000.gz)"
  echo ""
  echo "If S3_BACKUP_BUCKET is set, downloads from S3 first."
  exit 1
fi

RESTORE_DIR="/tmp/mongodb-restore-$$"

# Download from S3 if bucket is configured
if [ -n "${S3_BACKUP_BUCKET:-}" ] && [ ! -f "/tmp/${ARCHIVE_NAME}" ]; then
  echo "Downloading backup from S3..."
  aws s3 cp "s3://${S3_BACKUP_BUCKET}/mongodb/${ARCHIVE_NAME}" "/tmp/${ARCHIVE_NAME}"
fi

if [ ! -f "/tmp/${ARCHIVE_NAME}" ]; then
  echo "Error: Archive not found at /tmp/${ARCHIVE_NAME}"
  exit 1
fi

echo "Extracting backup..."
mkdir -p "${RESTORE_DIR}"
tar -xzf "/tmp/${ARCHIVE_NAME}" -C "${RESTORE_DIR}"

echo "Restoring MongoDB..."
mongorestore \
  --uri="${MONGODB_URI}" \
  --gzip \
  --drop \
  "${RESTORE_DIR}"

# Cleanup
rm -rf "${RESTORE_DIR}"
echo "Restore completed from: ${ARCHIVE_NAME}"
