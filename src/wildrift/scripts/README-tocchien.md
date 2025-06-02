# TocChien.net Items Crawling Scripts

Các script để crawl thông tin trang bị Liên Minh Tốc Chiến từ trang web https://tocchien.net/items/

## 📋 Danh sách Scripts

### 1. `crawl-tocchien-items.ts`
**Mục đích**: Crawl danh sách trang bị cơ bản từ trang chủ items
**Chạy**: `npm run crawl:tocchien-items`

**Chức năng**:
- Tải trang https://tocchien.net/items/
- Phân tích HTML để tìm tên trang bị
- Phân loại trang bị theo category (Physical, Magic, Defense, Boots, Support)
- Lưu thông tin cơ bản vào database
- Tạo file cache `tocchien-items-page.html`
- Xuất dữ liệu thô ra `tocchien-items-data.json`

**Kết quả**:
- Tạo/cập nhật records trong collection `WrItem`
- Mỗi item có: name, category, description cơ bản

### 2. `crawl-tocchien-item-details.ts`
**Mục đích**: Crawl thông tin chi tiết của từng trang bị
**Chạy**: `npm run crawl:tocchien-item-details`

**Chức năng**:
- Lấy danh sách items từ database
- Tạo URL chi tiết cho từng item: `https://tocchien.net/items/{slug}/`
- Crawl thông tin chi tiết:
  - Hình ảnh (imageUrl)
  - Mô tả chi tiết (description)
  - Chỉ số (stats): Attack Damage, Ability Power, Health, Armor, etc.
  - Giá tiền (price)
  - Kỹ năng chủ động/bị động (isActive, activeDescription, cooldown)
  - Thành phần chế tạo (buildsFrom, buildsInto)
- Cập nhật thông tin vào database
- Có delay 1 giây giữa các request để tránh spam

### 3. `check-tocchien-items.ts`
**Mục đích**: Kiểm tra và thống kê kết quả crawl
**Chạy**: `npm run check:tocchien-items`

**Chức năng**:
- Hiển thị tổng số items theo category
- Thống kê tỷ lệ items có đầy đủ thông tin:
  - Có hình ảnh
  - Có stats
  - Có giá tiền
  - Có mô tả chi tiết
  - Có kỹ năng chủ động
  - Có thành phần chế tạo
- Hiển thị sample items cho mỗi category
- Liệt kê items thiếu thông tin

## 🚀 Cách sử dụng

### Bước 1: Crawl danh sách items cơ bản
```bash
npm run crawl:tocchien-items
```

### Bước 2: Crawl thông tin chi tiết
```bash
npm run crawl:tocchien-item-details
```

### Bước 3: Kiểm tra kết quả
```bash
npm run check:tocchien-items
```

## 📊 Cấu trúc dữ liệu

### WrItem Schema
```typescript
{
  name: string;           // Tên trang bị (VD: "ÁO CHOÀNG BÓNG TỐI")
  description: string;    // Mô tả chi tiết
  stats: {               // Chỉ số trang bị
    "Attack Damage": 50,
    "Health": 300,
    "Armor": 40
  };
  price: number;         // Giá tiền (gold)
  buildsFrom: string[];  // Chế tạo từ các items
  buildsInto: string[];  // Nâng cấp thành các items
  category: string;      // Physical|Magic|Defense|Boots|Support|Other
  isActive: boolean;     // Có kỹ năng chủ động không
  activeDescription: string; // Mô tả kỹ năng chủ động
  cooldown: number;      // Thời gian hồi chiêu (giây)
  imageUrl: string;      // URL hình ảnh
  patch: string;         // Phiên bản game
}
```

## 🔧 Tính năng

### Phân loại tự động
Script tự động phân loại trang bị dựa trên tên:
- **Physical**: kiếm, cung, búa, rìu, dao, súng, móng vuốt, lưỡi hái
- **Magic**: trượng, sách, mũ, ngọc, vọng âm, mặt nạ, thiên thạch, lõi từ, pháo đài
- **Defense**: giáp, khiên, áo choàng, băng giáp, tấm chắn
- **Boots**: giày
- **Support**: dây chuyền, lời thề, tụ bão, lư hương, thú bông

### Xử lý lỗi
- Retry mechanism cho failed requests
- Skip items không tìm thấy trang chi tiết
- Log chi tiết cho debugging
- Tiếp tục crawl khi gặp lỗi đơn lẻ

### Cache và Performance
- Cache HTML page để tránh download lại
- Delay giữa requests để tránh rate limiting
- Batch processing với progress tracking

## 📝 Logs và Debug

### Log Files
- `tocchien-items-page.html`: Cache trang chủ items
- `tocchien-items-data.json`: Dữ liệu thô đã crawl

### Console Output
- Progress tracking cho từng item
- Error logging với chi tiết
- Summary statistics sau khi hoàn thành

## ⚠️ Lưu ý

1. **Rate Limiting**: Script có delay 1 giây giữa các request để tránh bị block
2. **Error Handling**: Nếu một item fail, script sẽ tiếp tục với item tiếp theo
3. **Data Validation**: Kiểm tra dữ liệu trước khi lưu vào database
4. **Incremental Updates**: Script có thể chạy nhiều lần để cập nhật dữ liệu

## 🔍 Troubleshooting

### Lỗi thường gặp:
1. **Network timeout**: Tăng timeout trong axios config
2. **HTML structure changed**: Cập nhật selectors trong script
3. **Database connection**: Kiểm tra MongoDB connection
4. **Missing dependencies**: Chạy `npm install`

### Debug tips:
1. Kiểm tra file cache HTML để xem cấu trúc trang
2. Sử dụng `check:tocchien-items` để xem thống kê
3. Kiểm tra console logs để tìm lỗi cụ thể 