# HOME API - Đa ngôn ngữ (Internationalization) Implementation

## 📖 Tổng quan
Đã thành công thêm tính năng đa ngôn ngữ vào Home API, cho phép API trả về dữ liệu theo ngôn ngữ được chỉ định (Tiếng Việt hoặc Tiếng Anh).

## 🔧 Các thay đổi đã thực hiện

### 1. Controller (`src/home/home.controller.ts`)
- ✅ Thêm support cho query parameter `lang`
- ✅ Tạo DTO `HomeQueryDto` để validate input
- ✅ Cập nhật Swagger documentation
- ✅ Thêm validation cho language code (`vi`, `en`)

### 2. Service (`src/home/home.service.ts`)
- ✅ Cập nhật `getHomePageData()` để nhận tham số `lang`
- ✅ Truyền tham số ngôn ngữ cho các service con:
  - `NewsService.findAll(limit, page, lang)`
  - `PcBuildService.findAllBuilds(limit, page, lang)`
  - `ChampionsService.findAll(page, limit, lang)`
  - `TftService.findAllChampions(lang)`
  - `WildriftService.findAllChampions()` (chưa hỗ trợ đa ngôn ngữ)
- ✅ Cập nhật cache key để bao gồm ngôn ngữ

### 3. DTO (`src/home/dto/home-query.dto.ts`)
- ✅ Tạo `HomeQueryDto` class
- ✅ Validation với `class-validator`
- ✅ Swagger documentation với `@ApiPropertyOptional`
- ✅ Default value: `'vi'`

### 4. Testing (`src/home/scripts/test-home-i18n.ts`)
- ✅ Tạo script test tính năng đa ngôn ngữ
- ✅ Test với cả tiếng Việt và tiếng Anh
- ✅ Kiểm tra structure dữ liệu trả về
- ✅ Thêm vào package.json scripts

## 📚 Cách sử dụng API

### Endpoints
```bash
# Lấy dữ liệu tiếng Việt (mặc định)
GET /home
GET /home?lang=vi

# Lấy dữ liệu tiếng Anh
GET /home?lang=en
```

### Response Structure
```json
{
  "status": "success",
  "data": {
    "latestNews": {
      "articles": [...],
      "total": 5
    },
    "latestPcBuilds": {
      "builds": [...],
      "total": 3
    },
    "randomChampions": [...],
    "randomTftChampions": [...],
    "randomWrChampions": [...]
  }
}
```

### Query Parameters
- `lang` (optional): Language code
  - Accepted values: `vi`, `en`
  - Default: `vi`
  - Validation: Phải là một trong hai giá trị được chấp nhận

## 🧪 Testing

### Chạy test script
```bash
npm run test:home-i18n
```

### Test cases
1. ✅ Vietnamese data retrieval
2. ✅ English data retrieval  
3. ✅ Default behavior (Vietnamese)
4. ✅ Data structure validation
5. ✅ Error handling

## 📝 Swagger Documentation

API đã được cập nhật với Swagger documentation bao gồm:
- Parameter description
- Example values
- Response schemas
- Error codes

## 🔍 Ghi chú kỹ thuật

### Language Support Status
- ✅ **NewsService**: Đã hỗ trợ đầy đủ
- ✅ **PcBuildService**: Đã hỗ trợ đầy đủ
- ✅ **ChampionsService**: Đã hỗ trợ đầy đủ
- ✅ **TftService**: Đã hỗ trợ đầy đủ
- ⚠️ **WildriftService**: Chưa hỗ trợ (tham số bị bỏ qua)

### Caching Strategy
- Cache key bao gồm language code: `home-page-data-${lang}`
- Expiration time: 5 phút (như cũ)
- Separate cache cho mỗi ngôn ngữ

### Error Handling
- Validation lỗi cho invalid language codes
- Fallback về empty arrays khi service gặp lỗi
- Logging errors cho debugging

## 🚀 Triển khai và Build

```bash
# Build project
npm run build

# Start development
npm run start:dev

# Start production
npm run start:prod
```

## 📊 Performance Considerations

1. **Caching**: Mỗi ngôn ngữ có cache riêng
2. **Database queries**: Tối ưu với lean() cho read-only operations
3. **Error handling**: Graceful fallbacks không làm crash API
4. **Validation**: Sử dụng class-validator cho input validation

## 🎯 Kết quả đạt được

✅ API Home hiện đã hỗ trợ đa ngôn ngữ hoàn chỉnh
✅ Backward compatibility được đảm bảo
✅ Documentation được cập nhật đầy đủ
✅ Testing script được cung cấp
✅ Tuân thủ chuẩn RESTful API
✅ Validation và error handling robust
✅ Build thành công không có lỗi

---

**Tác giả**: AI Assistant
**Ngày**: `date`
**Version**: 1.0.0 