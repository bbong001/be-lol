# PC Build Module Testing Guide

## 📋 Tổng quan

Module PC Build cung cấp các chức năng CRUD để quản lý cấu hình máy tính với hỗ trợ đa ngôn ngữ (vi/en).

## 🧪 Các loại test đã tạo

### 1. Unit Tests
- **File**: `src/pc-build/pc-build.service.spec.ts`
- **Mô tả**: Test các method của PcBuildService
- **Chạy**: `npm run test -- --testPathPattern=pc-build.service.spec.ts`

### 2. E2E Tests  
- **File**: `test/pc-build.e2e-spec.ts`
- **Mô tả**: Test toàn bộ API endpoints
- **Yêu cầu**: Cần cài `mongodb-memory-server`
- **Chạy**: `npm run test:e2e -- --testPathPattern=pc-build.e2e-spec.ts`

### 3. Integration Tests
- **File**: `src/pc-build/scripts/test-pc-build-crud.ts`
- **Mô tả**: Test CRUD operations với database thực
- **Chạy**: `ts-node src/pc-build/scripts/test-pc-build-crud.ts`

### 4. API Demo
- **File**: `src/pc-build/scripts/demo-api-endpoints.ts`
- **Mô tả**: Demo các API endpoints qua HTTP requests
- **Chạy**: `ts-node src/pc-build/scripts/demo-api-endpoints.ts`

## 🚀 Hướng dẫn test chức năng CREATE và UPDATE

### Test 1: Unit Test Service
```bash
npm run test -- --testPathPattern=pc-build.service.spec.ts
```

**Kết quả mong đợi:**
- ✅ Test create build thành công
- ✅ Test create với default language
- ✅ Test update build thành công  
- ✅ Test update với partial data
- ✅ Test error handling (Not Found, Forbidden)

### Test 2: Test với Database thực
```bash
npm run test:pc-build-lang
```

**Kết quả mong đợi:**
- ✅ Hiển thị danh sách builds theo ngôn ngữ
- ✅ Test các API endpoints
- ✅ Kiểm tra migration đa ngôn ngữ

### Test 3: Demo API Endpoints
```bash
ts-node src/pc-build/scripts/demo-api-endpoints.ts
```

**Kết quả mong đợi:**
- ✅ Liệt kê tất cả API endpoints
- ✅ Test GET endpoints (không cần auth)
- ✅ Hiển thị lỗi 401 cho endpoints cần auth
- ✅ Cung cấp curl commands mẫu

## 📝 Test Cases cho CREATE

### 1. Create PC Build thành công
```typescript
const createDto = {
  name: 'Gaming PC Build 2024',
  description: 'High-end gaming setup',
  content: '# Gaming PC Build\n...',
  imageUrl: 'https://example.com/image.jpg',
  tags: ['gaming', 'high-end'],
  isPublic: true,
  lang: 'vi'
};
```

### 2. Create với default language
```typescript
const createDto = {
  name: 'Gaming PC Build',
  description: 'Gaming setup',
  content: '# Gaming PC Build\n...',
  // lang không được chỉ định -> mặc định 'vi'
};
```

### 3. Create với validation errors
```typescript
const invalidDto = {
  // Thiếu name (required)
  description: 'Missing name',
  lang: 'invalid-lang' // Không hợp lệ
};
```

## 📝 Test Cases cho UPDATE

### 1. Update thành công (owner)
```typescript
const updateDto = {
  name: 'Updated Gaming PC',
  description: 'Updated description',
  tags: ['updated', 'gaming'],
  isPublic: false
};
```

### 2. Partial Update
```typescript
const partialDto = {
  name: 'Only Name Updated'
  // Các field khác giữ nguyên
};
```

### 3. Update errors
- ❌ Build không tồn tại → 404 Not Found
- ❌ User không phải owner → 403 Forbidden
- ❌ Invalid ObjectId → 400 Bad Request

## 🔐 Authentication Requirements

### Admin Required (CREATE)
```bash
POST /pc-build/builds
Authorization: Bearer <admin_jwt_token>
```

### Owner/Admin Required (UPDATE/DELETE)
```bash
PUT /pc-build/builds/:id
DELETE /pc-build/builds/:id
Authorization: Bearer <jwt_token>
```

### Public Access (READ)
```bash
GET /pc-build/builds
GET /pc-build/builds/:id
GET /pc-build/tag/:tag
# Không cần authentication
```

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/pc-build/builds` | None | Lấy danh sách builds public |
| GET | `/pc-build/builds/:id` | None | Lấy build theo ID |
| GET | `/pc-build/tag/:tag` | None | Lấy builds theo tag |
| GET | `/pc-build/user/builds` | User | Lấy builds của user |
| GET | `/pc-build/admin/builds` | Admin | Admin lấy tất cả builds |
| POST | `/pc-build/builds` | Admin | Tạo build mới |
| PUT | `/pc-build/builds/:id` | Owner/Admin | Cập nhật build |
| DELETE | `/pc-build/builds/:id` | Owner/Admin | Xóa build |

## 📊 Query Parameters

### Language Filter
```bash
?lang=vi    # Tiếng Việt
?lang=en    # Tiếng Anh
```

### Pagination
```bash
?limit=10   # Số lượng items
?page=1     # Trang hiện tại
```

## 🔧 Cách chạy test manual

### 1. Khởi động server
```bash
npm run start:dev
```

### 2. Test với curl

#### Lấy danh sách builds
```bash
curl -X GET "http://localhost:3000/pc-build/builds?limit=5&lang=vi"
```

#### Tạo build mới (cần admin token)
```bash
curl -X POST "http://localhost:3000/pc-build/builds" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Test Gaming PC",
    "description": "Test build",
    "content": "# Test PC Build\n...",
    "tags": ["test", "gaming"],
    "isPublic": true,
    "lang": "vi"
  }'
```

#### Cập nhật build (cần owner/admin token)
```bash
curl -X PUT "http://localhost:3000/pc-build/builds/BUILD_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Gaming PC",
    "description": "Updated description"
  }'
```

## ✅ Checklist Test

- [ ] Unit tests pass
- [ ] E2E tests pass (nếu có mongodb-memory-server)
- [ ] Integration tests với database thực
- [ ] API endpoints demo
- [ ] Manual testing với curl
- [ ] Authentication/Authorization working
- [ ] Language filtering working
- [ ] Pagination working
- [ ] Error handling working
- [ ] Validation working

## 🐛 Troubleshooting

### Lỗi "mongodb-memory-server not found"
```bash
npm install --save-dev mongodb-memory-server
```

### Lỗi "this.pcBuildModel is not a constructor"
- Đây là lỗi trong unit test mock
- Sử dụng integration test thay thế

### Lỗi 401 Unauthorized
- Cần tạo user admin và lấy JWT token
- Hoặc test với endpoints public

### Database connection error
- Kiểm tra MongoDB đang chạy
- Kiểm tra connection string trong .env 