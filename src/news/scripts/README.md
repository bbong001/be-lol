# 📰 Kicdo.com News Crawler

Bộ công cụ crawl tin tức từ trang web [kicdo.com](https://kicdo.com) để lưu vào database của hệ thống.

## 📋 Danh sách Script

### 1. `test-crawl-kicdo.ts` - Test cấu trúc HTML
```bash
npm run test:kicdo-structure
```

**Mục đích**: Kiểm tra cấu trúc HTML của trang web để xác định selector phù hợp trước khi crawl thật.

**Kết quả**:
- Phân tích cấu trúc trang chủ
- Test các selector cho links, title, content, images
- Hiển thị class names phổ biến
- Đưa ra gợi ý selector tối ưu

### 2. `crawl-kicdo-news.ts` - Crawl cơ bản
```bash
npm run crawl:kicdo-news
```

**Mục đích**: Script crawl đơn giản, crawl tối đa 10 bài viết từ trang tin LOL.

**Tính năng**:
- Crawl từ `/tin-lol-n1`
- Sử dụng multiple selector fallbacks
- Auto-generate slug từ title
- Delay 1s giữa các request
- Lưu trực tiếp vào database

### 3. `crawl-kicdo-advanced.ts` - Crawl nâng cao
```bash
npm run crawl:kicdo-advanced
```

**Mục đích**: Script crawl toàn diện với nhiều tính năng nâng cao.

**Tính năng**:
- Crawl từ nhiều trang: `/tin-lol-n1`, `/tin-tuc-lien-minh-huyen-thoai`, `/game-lol`
- Retry logic với exponential backoff
- Lưu URL list và báo cáo crawl
- Clean HTML content
- Filter URL không mong muốn
- Configurable selectors
- Tạo thư mục `crawl-output` với reports

## 🔧 Cấu hình

### Biến môi trường cần thiết
```env
MONGODB_URI=mongodb://localhost:27017/lol-check
JWT_SECRET=your-jwt-secret
```

### Database Requirements
- Cần có user admin với ID: `681dcf20cf2e99c8b82923a7`
- Article schema đã được thiết lập
- MongoDB connection đang hoạt động

## 📊 Định dạng dữ liệu đầu ra

Mỗi bài viết được crawl sẽ có cấu trúc:

```typescript
{
  title: string;           // Tiêu đề bài viết
  slug: string;            // SEO-friendly URL slug
  content: string;         // Nội dung HTML
  summary: string;         // Tóm tắt (từ meta description hoặc đoạn đầu)
  imageUrl: string;        // URL ảnh đại diện
  tags: string[];          // Tags ['LOL', 'Tin tức', 'Kicdo']
  published: boolean;      // false (để admin review trước)
  author: ObjectId;        // ID của admin user
  createdAt: Date;         // Thời gian tạo
  updatedAt: Date;         // Thời gian cập nhật
}
```

## 🚀 Quy trình crawl đề xuất

1. **Test cấu trúc trước**:
   ```bash
   npm run test:kicdo-structure
   ```

2. **Chạy crawl cơ bản để test**:
   ```bash
   npm run crawl:kicdo-news
   ```

3. **Chạy crawl nâng cao để thu thập nhiều hơn**:
   ```bash
   npm run crawl:kicdo-advanced
   ```

4. **Kiểm tra kết quả**:
   - Check database: collection `articles`
   - Check file reports trong `crawl-output/`
   - Review và publish articles qua admin panel

## ⚙️ Tuỳ chỉnh Crawler

### Thay đổi selector trong `crawl-kicdo-advanced.ts`:

```typescript
this.config = {
  // Thêm/sửa selector dựa trên kết quả test
  titleSelectors: [
    'h1.article-title',    // Selector chính xác nhất
    'h1',                  // Fallback
  ],
  
  contentSelectors: [
    '.article-content',    // Selector chính xác nhất
    '.content',           // Fallback
  ],
  
  // Điều chỉnh số lượng và delay
  maxArticles: 50,       // Tăng số bài crawl
  delay: 3000,          // Tăng delay tránh bị block
};
```

## 📁 Output Files

Sau khi chạy `crawl:kicdo-advanced`, các file sẽ được tạo trong `crawl-output/`:

- `kicdo-urls-YYYY-MM-DD.json`: Danh sách tất cả URLs tìm được
- `kicdo-crawl-report-YYYY-MM-DD.json`: Báo cáo chi tiết quá trình crawl

## ⚠️ Lưu ý quan trọng

1. **Respect robots.txt**: Kiểm tra `https://kicdo.com/robots.txt` trước khi crawl
2. **Rate limiting**: Giữ delay ít nhất 1-2 giây giữa các request
3. **Error handling**: Script sẽ tiếp tục crawl ngay cả khi một số bài lỗi
4. **Content review**: Tất cả bài được set `published: false` để admin review
5. **Duplicate handling**: Slug duplicate sẽ bị reject, check logs để debug

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **Network timeout**:
   ```
   Error: timeout of 10000ms exceeded
   ```
   - Tăng timeout hoặc check network connection

2. **Selector không hoạt động**:
   ```
   Failed to extract content from: [URL]
   ```
   - Chạy `test:kicdo-structure` để kiểm tra selector mới

3. **Database connection failed**:
   ```
   MongooseError: ...
   ```
   - Kiểm tra MONGODB_URI và database đang chạy

4. **Duplicate slug error**:
   ```
   An article with slug "..." already exists
   ```
   - Bài viết đã tồn tại, script sẽ skip và tiếp tục

## 📞 Support

Nếu cần hỗ trợ hoặc có vấn đề với crawler, hãy:
1. Check logs trong console
2. Kiểm tra file reports trong `crawl-output/`
3. Test lại với `test:kicdo-structure`
4. Điều chỉnh selectors nếu cần thiết 