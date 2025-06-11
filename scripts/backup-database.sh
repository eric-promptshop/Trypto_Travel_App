#!/bin/bash

# Database Backup Script
# Performs automated database backups with rotation

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
BACKUP_DIR="./backups/database"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILENAME="backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}Starting database backup...${NC}"
echo -e "${YELLOW}Timestamp: ${TIMESTAMP}${NC}"

# Determine database type from DATABASE_URL
if [[ "$DATABASE_URL" == postgres* ]]; then
    echo -e "${GREEN}Detected PostgreSQL database${NC}"
    
    # Parse connection string
    # Format: postgresql://user:password@host:port/database
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        # Perform backup
        PGPASSWORD="$DB_PASS" pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -f "$BACKUP_DIR/$BACKUP_FILENAME" \
            --verbose \
            --no-owner \
            --no-privileges
    else
        echo -e "${RED}Error: Could not parse DATABASE_URL${NC}"
        exit 1
    fi
    
elif [[ "$DATABASE_URL" == mysql* ]]; then
    echo -e "${GREEN}Detected MySQL database${NC}"
    
    # Parse MySQL connection string
    if [[ $DATABASE_URL =~ mysql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        # Perform backup
        mysqldump \
            -h "$DB_HOST" \
            -P "$DB_PORT" \
            -u "$DB_USER" \
            -p"$DB_PASS" \
            "$DB_NAME" \
            > "$BACKUP_DIR/$BACKUP_FILENAME"
    else
        echo -e "${RED}Error: Could not parse DATABASE_URL${NC}"
        exit 1
    fi
    
else
    echo -e "${YELLOW}Using Prisma for backup (SQLite or other)${NC}"
    
    # Use Prisma's built-in backup functionality
    npx prisma db pull
    cp prisma/schema.prisma "$BACKUP_DIR/schema_${TIMESTAMP}.prisma"
    
    # For SQLite, copy the database file
    if [[ "$DATABASE_URL" == file:* ]]; then
        DB_FILE=$(echo "$DATABASE_URL" | sed 's/file://')
        cp "$DB_FILE" "$BACKUP_DIR/$BACKUP_FILENAME"
    fi
fi

# Compress backup
echo -e "${GREEN}Compressing backup...${NC}"
gzip "$BACKUP_DIR/$BACKUP_FILENAME"
COMPRESSED_FILE="$BACKUP_DIR/$BACKUP_FILENAME.gz"

# Calculate file size
FILE_SIZE=$(ls -lh "$COMPRESSED_FILE" | awk '{print $5}')
echo -e "${GREEN}Backup created: ${COMPRESSED_FILE} (${FILE_SIZE})${NC}"

# Upload to cloud storage (optional)
if [ -n "$AWS_S3_BUCKET" ]; then
    echo -e "${GREEN}Uploading to S3...${NC}"
    aws s3 cp "$COMPRESSED_FILE" "s3://$AWS_S3_BUCKET/database-backups/" --storage-class GLACIER
elif [ -n "$GOOGLE_CLOUD_BUCKET" ]; then
    echo -e "${GREEN}Uploading to Google Cloud Storage...${NC}"
    gsutil cp "$COMPRESSED_FILE" "gs://$GOOGLE_CLOUD_BUCKET/database-backups/"
fi

# Cleanup old backups
echo -e "${GREEN}Cleaning up old backups...${NC}"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
echo -e "${GREEN}Backup complete! Total backups: ${BACKUP_COUNT}${NC}"

# Verify backup
echo -e "${GREEN}Verifying backup integrity...${NC}"
gunzip -t "$COMPRESSED_FILE" && echo -e "${GREEN}✓ Backup is valid${NC}" || echo -e "${RED}✗ Backup is corrupted${NC}"

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Database backup completed successfully. Size: ${FILE_SIZE}\"}" \
        "$SLACK_WEBHOOK_URL"
fi