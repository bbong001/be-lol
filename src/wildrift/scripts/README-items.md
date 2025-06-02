# Wild Rift Items Crawler

Tool crawl dữ liệu các item Wild Rift từ trang web [lolwildriftbuild.com](https://lolwildriftbuild.com/items/).

## 🚀 Cách sử dụng

### 1. Tải trang web (Tùy chọn)
```bash
npm run download:wr-items-page
```
Script này sẽ:
- Tải HTML từ trang items
- Lưu vào file `wr-items-page.html`
- Phân tích cơ bản nội dung trang

### 2. Crawl items
```bash
npm run crawl:wr-items
```
Script này sẽ:
- Đọc HTML (từ file cache hoặc tải mới)
- Phân tích và phân loại items theo category
- Lưu vào MongoDB database
- Tạo báo cáo kết quả

### 3. Kiểm tra kết quả
```bash
npm run check:wr-items
```
Script này sẽ hiển thị:
- Tổng số items trong database
- Phân loại theo category
- Items không có hình ảnh
- Items trùng tên
- Mẫu dữ liệu chi tiết

## 📊 Các category được phân loại

1. **Physical Items** - Trang bị vật lý (AD, Attack Speed, Crit)
2. **Magic Items** - Trang bị phép thuật (AP, Mana, CDR)
3. **Defense Items** - Trang bị phòng thủ (Armor, MR, Health)
4. **Boots Items** - Giày và enchantments
5. **Unknown** - Items không xác định được category

## 🗂️ Cấu trúc dữ liệu

Mỗi item được lưu với các thông tin:

```typescript
{
  name: string;           // Tên item
  description: string;    // Mô tả
  stats: object;          // Chỉ số (sẽ cập nhật sau)
  price: number;          // Giá (mặc định 0)
  buildsFrom: string[];   // Tạo từ items nào
  buildsInto: string[];   // Tạo thành items nào
  category: string;       // Phân loại
  isActive: boolean;      // Có active effect không
  activeDescription: string; // Mô tả active
  cooldown: number;       // Cooldown active
  imageUrl: string;       // URL hình ảnh
  patch: string;          // Phiên bản game
}
```

## 🔧 Tùy chỉnh

### Thêm category mới
Chỉnh sửa logic phân loại trong file `crawl-wr-items.ts`:

```typescript
// Determine category based on surrounding text
if (parentText.includes('new-category')) {
  category = 'NewCategory';
}
```

### Cải thiện crawler
- Thêm selector mới trong `parseItemsFromImages()`
- Cập nhật logic lọc images
- Thêm xử lý cho stats và price

## 📝 Files tạo ra

1. `wr-items-page.html` - HTML cache của trang web
2. `wr-items-crawl-results.json` - Báo cáo chi tiết kết quả crawl

## ⚠️ Lưu ý

- Script sử dụng User-Agent để tránh bị block
- Có thể cần cập nhật selectors nếu trang web thay đổi cấu trúc
- Items sẽ được upsert (tạo mới hoặc cập nhật) dựa trên tên

## 🚨 Troubleshooting

### Không crawl được items
1. Kiểm tra kết nối internet
2. Chạy `download:wr-items-page` để xem trang web có tải được không
3. Kiểm tra file HTML có chứa dữ liệu items không

### Lỗi database
1. Đảm bảo MongoDB đang chạy
2. Kiểm tra connection string trong `.env`
3. Xác minh schema WrItem đã được đăng ký

### Items bị trùng
1. Chạy `check:wr-items` để xem danh sách trùng
2. Có thể cần cleanup database thủ công
3. Cải thiện logic deduplication trong crawler 