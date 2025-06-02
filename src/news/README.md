# News Module - Đa ngôn ngữ đơn giản

## 🎯 Tổng quan
Thêm trường `lang` vào Article schema để hỗ trợ đa ngôn ngữ mà **không phá vỡ cấu trúc cũ**.

## 🏗️ Thay đổi

### Schema mới:
```typescript
{
  title: string,          // Giữ nguyên
  content: string,        // Giữ nguyên  
  summary: string,        // Giữ nguyên
  tags: string[],         // Giữ nguyên
  lang: 'vi' | 'en',      // MỚI - Mặc định 'vi'
  // ... các trường khác không đổi
}
```

### API mới:
```bash
# Lấy bài viết tiếng Việt
GET /news?lang=vi

# Lấy bài viết tiếng Anh  
GET /news?lang=en

# Lấy bài viết theo slug + ngôn ngữ
GET /news/:slug?lang=vi

# Admin: Tạo bài viết tiếng Anh
POST /news 
{
  "title": "English Title",
  "content": "English content...",
  "lang": "en"
}
```

## 🚀 Migration

### Chạy migration:
```bash
npm run migrate:news-lang
```

Script sẽ:
- Cập nhật tất cả bài viết cũ có `lang: 'vi'`
- Không thay đổi gì khác

## 💡 Workflow Admin

1. **Bài viết cũ**: Tự động có `lang: 'vi'`
2. **Bài viết mới tiếng Việt**: Không cần set lang (mặc định 'vi')
3. **Bài viết mới tiếng Anh**: Set `lang: 'en'` khi tạo

## 🔍 Ví dụ sử dụng

### Frontend không đổi gì:
```javascript
// API cũ vẫn hoạt động (mặc định tiếng Việt)
fetch('/news')

// Nếu muốn tiếng Anh
fetch('/news?lang=en')
```

### Admin tạo bài tiếng Anh:
```json
{
  "title": "League of Legends Guide", 
  "content": "This is an English guide...",
  "summary": "English summary",
  "tags": ["guide", "lol"],
  "lang": "en",
  "published": true
}
```

## ✅ Ưu điểm

- ✅ **Không breaking change** với frontend hiện tại
- ✅ **Đơn giản** và dễ hiểu
- ✅ **Tương thích ngược** 100%
- ✅ Admin có thể tạo song song bài viết tiếng Việt và Anh
- ✅ SEO friendly (slug khác nhau cho từng ngôn ngữ) 