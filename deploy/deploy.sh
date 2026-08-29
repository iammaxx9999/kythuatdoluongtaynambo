#!/usr/bin/env bash
#
# Cập nhật code mới lên VPS đang chạy.
#
# CÁCH DÙNG (chạy trên VPS, trong thư mục project):
#   chmod +x deploy/deploy.sh
#   ./deploy/deploy.sh
#
# Trình tự có chủ ý: SAO LƯU trước, rồi mới lấy code mới. Bước nào lỗi thì
# dừng ngay (set -e) và app cũ vẫn đang chạy, chưa bị ảnh hưởng.

set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> 1/5 Sao lưu dữ liệu hiện tại"
./deploy/backup.sh

echo "==> 2/5 Lấy code mới"
git pull --ff-only

echo "==> 3/5 Cài thư viện (chỉ phần chạy thật)"
# npm ci đọc package-lock.json -> cài đúng phiên bản đã kiểm thử.
# --omit=dev bỏ thư viện chỉ dùng cho phát triển.
npm ci --omit=dev

echo "==> 4/5 Chạy kiểm thử"
# Chạy được ngay sau `npm ci --omit=dev` vì project không có devDependencies —
# bộ test chỉ dùng thư viện chuẩn của Node.
# Test dùng thư mục dữ liệu TẠM nên không đụng vào nội dung thật.
npm test || {
  echo "!! Kiểm thử KHÔNG đạt — dừng lại, app cũ vẫn đang chạy bình thường."
  exit 1
}

echo "==> 5/5 Khởi động lại"
pm2 restart candien --update-env
pm2 save

sleep 2
echo
echo "==> Kiểm tra lại"
if curl -fsS http://127.0.0.1:3000/healthz > /dev/null; then
  echo "    App phản hồi bình thường."
else
  echo "!!  App KHÔNG phản hồi. Xem log: pm2 logs candien --lines 50"
  exit 1
fi

pm2 status candien
