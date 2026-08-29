#!/usr/bin/env bash
#
# Sao lưu nội dung website: db.json, tài khoản, và toàn bộ ảnh đã tải lên.
#
# CÁCH DÙNG:
#   chmod +x deploy/backup.sh
#   ./deploy/backup.sh                  # lưu vào ~/backups
#   ./deploy/backup.sh /mnt/backup      # lưu vào chỗ khác
#
# Chạy tự động mỗi đêm 2 giờ sáng:
#   crontab -e
#   0 2 * * * /var/www/candien/deploy/backup.sh >> /var/log/candien-backup.log 2>&1
#
# LƯU Ý: bản sao lưu chứa credentials.json (mật khẩu đã băm) và khóa phiên.
# Đừng để thư mục sao lưu ở nơi web truy cập được.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${1:-$HOME/backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"

STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$DEST/candien-$STAMP.tar.gz"

mkdir -p "$DEST"

# --exclude tệp tạm: db.json.tmp là bản đang ghi dở, sao lưu vào là hỏng
tar -czf "$ARCHIVE" \
  --exclude='*.tmp' \
  -C "$PROJECT_DIR" \
  server/data \
  public/uploads 2>/dev/null

chmod 600 "$ARCHIVE"

echo "$(date '+%F %T')  Đã sao lưu: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# Dọn bản cũ hơn KEEP_DAYS ngày
DELETED="$(find "$DEST" -name 'candien-*.tar.gz' -type f -mtime "+$KEEP_DAYS" -print -delete | wc -l)"
[ "$DELETED" -gt 0 ] && echo "$(date '+%F %T')  Đã dọn $DELETED bản sao lưu cũ hơn $KEEP_DAYS ngày"

exit 0
