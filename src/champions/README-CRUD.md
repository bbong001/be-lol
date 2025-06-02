# Champion CRUD Operations

Tài liệu này mô tả các chức năng Create, Read, Update, Delete (CRUD) cho Champion trong hệ thống.

## 📋 Tổng quan

Các chức năng CRUD cho Champion đã được thêm vào hệ thống với đầy đủ validation, authentication và authorization.

## 🔐 Phân quyền

Tất cả các thao tác Create, Update, Delete đều yêu cầu:
- **Authentication**: JWT token hợp lệ
- **Authorization**: Role `ADMIN`

Chỉ có thao tác Read (GET) là public.

## 📝 API Endpoints

### 1. Create Champion
```http
POST /champions
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Yasuo",
  "id": "Yasuo",
  "title": "the Unforgiven",
  "imageUrl": "https://example.com/yasuo.jpg",
  "splashUrl": "https://example.com/yasuo-splash.jpg",
  "stats": {
    "hp": 580,
    "hpperlevel": 90,
    "mp": 338,
    "mpperlevel": 38,
    "movespeed": 345,
    "armor": 33,
    "armorperlevel": 3.2,
    "spellblock": 32,
    "spellblockperlevel": 1.3,
    "attackrange": 175,
    "hpregen": 8.5,
    "hpregenperlevel": 0.55,
    "mpregen": 8.2,
    "mpregenperlevel": 0.45,
    "crit": 0,
    "critperlevel": 0,
    "attackdamage": 60,
    "attackdamageperlevel": 3.2,
    "attackspeedperlevel": 2.5,
    "attackspeed": 0.658
  },
  "abilities": [
    {
      "name": "Steel Tempest",
      "description": "Yasuo thrusts forward with his sword...",
      "imageUrl": "https://example.com/yasuo-q.jpg"
    }
  ],
  "tags": ["Fighter", "Assassin"],
  "counters": ["Malphite", "Rammus"],
  "strongAgainst": ["Zed", "Talon"],
  "recommendedRunes": [
    {
      "primary": "Precision",
      "keystone": "Conqueror",
      "runes": ["Triumph", "Legend: Alacrity", "Last Stand"]
    }
  ],
  "recommendedItems": [
    {
      "name": "Immortal Shieldbow",
      "cost": 3400
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Yasuo",
    "id": "Yasuo",
    "title": "the Unforgiven",
    // ... other fields
  },
  "message": "Champion created successfully"
}
```

### 2. Update Champion
```http
PUT /champions/:id
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "title": "the Updated Unforgiven",
  "stats": {
    "hp": 600
  },
  "tags": ["Fighter", "Assassin", "Updated"]
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Yasuo",
    "title": "the Updated Unforgiven",
    // ... updated fields
  },
  "message": "Champion updated successfully"
}
```

### 3. Delete Champion
```http
DELETE /champions/:id
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "status": "success",
  "message": "Champion 'Yasuo' has been deleted successfully"
}
```

### 4. Get All Champions (existing)
```http
GET /champions?page=1&limit=20
```

### 5. Get Champion by ID (existing)
```http
GET /champions/:id
```

### 6. Search Champion by Name (existing)
```http
GET /champions/name/:name
```

## 🧪 Testing

Để test các chức năng CRUD, chạy script test:

```bash
npm run test:champion-crud
```

Script này sẽ:
1. Tạo một champion test
2. Đọc champion vừa tạo
3. Cập nhật champion
4. Tìm kiếm champion
5. Xóa champion
6. Xác nhận champion đã bị xóa

## 📊 Validation Rules

### Required Fields
- `name`: Tên champion (string, không trống)
- `id`: ID champion (string, không trống, unique)

### Optional Fields
- `title`: Danh hiệu champion
- `imageUrl`: URL hình ảnh champion
- `splashUrl`: URL hình ảnh splash
- `stats`: Object chứa các chỉ số champion
- `abilities`: Array các kỹ năng
- `tags`: Array các tag
- `counters`: Array tên champion bị khắc chế
- `strongAgainst`: Array tên champion mạnh hơn
- `recommendedRunes`: Array ngọc khuyến nghị
- `recommendedItems`: Array trang bị khuyến nghị

### Ability Validation
Mỗi ability phải có:
- `name`: Tên kỹ năng (required)
- `description`: Mô tả kỹ năng (required)
- `imageUrl`: URL hình ảnh (optional)

## ⚠️ Error Handling

### Common Errors

1. **401 Unauthorized**: Không có JWT token hoặc token không hợp lệ
2. **403 Forbidden**: Không có quyền admin
3. **400 Bad Request**: Dữ liệu validation không hợp lệ
4. **404 Not Found**: Champion không tồn tại (cho update/delete)
5. **409 Conflict**: Champion với ID/name đã tồn tại (cho create)

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## 🔄 Integration với Existing Features

Các chức năng CRUD mới tích hợp hoàn toàn với:
- ✅ Riot API sync (existing)
- ✅ Champion build crawler (existing)
- ✅ Counter data management (existing)
- ✅ Search functionality (existing)
- ✅ Pagination (existing)

## 📈 Performance Considerations

1. **Indexing**: Champion schema đã có index trên `name` và `id`
2. **Validation**: Sử dụng class-validator cho validation hiệu quả
3. **Caching**: Tự động reload champions data sau mỗi thao tác CUD
4. **Lean Queries**: Sử dụng `.lean()` cho read operations

## 🚀 Next Steps

Có thể mở rộng thêm:
1. Bulk operations (create/update nhiều champions cùng lúc)
2. Champion versioning (lưu lịch sử thay đổi)
3. Advanced search filters
4. Champion relationships management
5. Audit logging cho admin actions 