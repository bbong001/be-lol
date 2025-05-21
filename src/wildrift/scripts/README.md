# Wild Rift Champions Scripts

Tài liệu này mô tả các script được tạo để xử lý dữ liệu tướng trong Wild Rift.

## Tổng quan

Dự án quản lý 127 tướng Wild Rift, cung cấp thông tin chi tiết về:
- Kỹ năng (abilities)
- Hình ảnh (splash art, avatar, skill icons)
- Thống kê (stats)
- Build khuyến nghị

## Các vấn đề đã giải quyết

### 1. Sửa tên kỹ năng và URL ảnh

Nhiều tướng trong database có tên kỹ năng không chính xác hoặc URL ảnh kỹ năng bị hỏng. Chúng tôi đã giải quyết bằng:
- Sử dụng Data Dragon CDN của Riot để lấy URL ảnh chính xác: `https://ddragon.leagueoflegends.com/cdn/{version}/img/...`
- Cập nhật tên kỹ năng cho tất cả tướng
- Xử lý một số trường hợp đặc biệt như Aatrox, Ambessa, Draven, Yasuo

### 2. Đồng bộ dữ liệu với Wild Rift

- Cập nhật "Nunu & Willump" thành "Nunu" để phù hợp với tên trong Wild Rift
- Kiểm tra và loại bỏ các tướng dư thừa không thuộc Wild Rift
- Sửa lỗi URL ảnh bị lỗi 404

## Các script chính

| Script | Mục đích |
|--------|----------|
| fix-champion-skill-urls-with-mobafire.ts | Sửa tên và URL kỹ năng tướng sử dụng Mobafire |
| fix-all-champions-ddragon.ts | Sửa tất cả URL ảnh tướng dùng Data Dragon CDN |
| check-all-skill-image-urls.ts | Kiểm tra tất cả URL ảnh kỹ năng có hoạt động |
| fix-champion-specific.ts | Sửa thông tin cho tướng cụ thể như Ambessa |
| fix-nunu-name.ts | Cập nhật tên Nunu & Willump -> Nunu |
| remove-extra-champions.ts | Loại bỏ các tướng không thuộc Wild Rift |

## Thống kê kết quả

Tổng số kỹ năng đã sửa: 445
Tổng số URL ảnh đã cập nhật: 560
Tổng số tướng đã xử lý: 127

## Cách sử dụng

Các lệnh để chạy script (được cấu hình trong package.json):

```bash
# Kiểm tra thông tin tướng
npm run check:wr-champion -- --name "Tên tướng"

# Kiểm tra URL ảnh kỹ năng
npm run check:all-skill-image-urls

# Sửa tất cả URL ảnh kỹ năng
npm run fix:all-champions-ddragon

# Loại bỏ tướng không thuộc Wild Rift
npm run remove:extra-champions
``` 