# TFT Items Multilingual API Guide

## 📋 Overview

The TFT Items API now supports **multilingual content** with English and Vietnamese languages. All item names and descriptions can be accessed in both languages.

## 🌐 Supported Languages

- `en` - English (default)
- `vi` - Vietnamese (Tiếng Việt)

## 📌 Base URL

```
http://localhost:3000/tft/items
```

## 🔐 Authentication

**Admin-only endpoints** require Bearer JWT token:

```bash
Authorization: Bearer <your-jwt-token>
```

---

## 📖 GET Endpoints (Public)

### 1. Get All TFT Items

```bash
GET /tft/items?lang={language}
```

**Parameters:**
- `lang` (optional): `en` or `vi` - defaults to `en`

**Example Requests:**

```bash
# English (default)
curl "http://localhost:3000/tft/items"

# English (explicit)
curl "http://localhost:3000/tft/items?lang=en"

# Vietnamese
curl "http://localhost:3000/tft/items?lang=vi"
```

**Response:**

```json
[
  {
    "_id": "abc123",
    "name": "Sunfire Cape",
    "description": "Deals magic damage to nearby enemies",
    "stats": {
      "health": "300",
      "armor": "25"
    },
    "components": ["Chain Vest", "Giant's Belt"],
    "isBasic": false,
    "imageUrl": "https://example.com/sunfire-cape.png",
    "patch": "14.24.1",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### 2. Get TFT Item by ID

```bash
GET /tft/items/{id}?lang={language}
```

**Parameters:**
- `id` (required): Item MongoDB ObjectId
- `lang` (optional): `en` or `vi` - defaults to `en`

**Example Requests:**

```bash
# English
curl "http://localhost:3000/tft/items/507f1f77bcf86cd799439011?lang=en"

# Vietnamese
curl "http://localhost:3000/tft/items/507f1f77bcf86cd799439011?lang=vi"
```

### 3. Get TFT Item by Name

```bash
GET /tft/items/name/{name}?lang={language}
```

**Parameters:**
- `name` (required): Item name (English or Vietnamese)
- `lang` (optional): `en` or `vi` - defaults to `en`

**Example Requests:**

```bash
# Find by English name
curl "http://localhost:3000/tft/items/name/Sunfire%20Cape?lang=en"

# Find by Vietnamese name (if exists)
curl "http://localhost:3000/tft/items/name/Áo%20Choàng%20Lửa?lang=vi"
```

---

## ✏️ Admin Endpoints (Authentication Required)

### 4. Create New TFT Item

```bash
POST /tft/items
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": {
    "en": "New Test Item",
    "vi": "Trang Bị Test Mới"
  },
  "description": {
    "en": "A powerful new item",
    "vi": "Một trang bị mạnh mẽ mới"
  },
  "stats": {
    "damage": "50",
    "health": "200"
  },
  "components": ["Sword", "Chain Vest"],
  "isBasic": false,
  "imageUrl": "https://example.com/new-item.png",
  "patch": "14.24.1"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:3000/tft/items" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "en": "New Test Item",
      "vi": "Trang Bị Test Mới"
    },
    "description": {
      "en": "A powerful new item",
      "vi": "Một trang bị mạnh mẽ mới"
    },
    "patch": "14.24.1"
  }'
```

### 5. Update TFT Item

```bash
PUT /tft/items/{id}
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body (Partial Update):**

```json
{
  "name": {
    "en": "Updated Item Name",
    "vi": "Tên Trang Bị Đã Cập Nhật"
  },
  "description": {
    "en": "Updated description",
    "vi": "Mô tả đã cập nhật"
  }
}
```

**Example Request:**

```bash
curl -X PUT "http://localhost:3000/tft/items/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "en": "Updated Item Name",
      "vi": "Tên Trang Bị Đã Cập Nhật"
    }
  }'
```

### 6. Delete TFT Item

```bash
DELETE /tft/items/{id}
Authorization: Bearer <jwt-token>
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:3000/tft/items/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## 📝 TypeScript Interfaces

### TFT Item (Response)

```typescript
interface TftItem {
  _id: string;
  name: string; // Localized based on lang parameter
  description?: string; // Localized based on lang parameter
  stats?: Record<string, any>;
  components?: string[];
  isBasic?: boolean;
  imageUrl?: string;
  patch: string;
  lang?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Multilingual Text (Create/Update)

```typescript
interface MultilingualText {
  en: string;
  vi: string;
}

interface CreateTftItemDto {
  name: MultilingualText;
  description?: MultilingualText;
  stats?: Record<string, any>;
  components?: string[];
  isBasic?: boolean;
  imageUrl?: string;
  patch: string;
  lang?: string;
}
```

---

## ❌ Error Responses

### 400 Bad Request - Validation Error

```json
{
  "statusCode": 400,
  "message": [
    "name.en should not be empty",
    "name.vi should not be empty"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "TFT Item with ID 507f1f77bcf86cd799439011 not found"
}
```

---

## 📊 Usage Examples

### Frontend React Example

```typescript
// Get items in user's preferred language
const fetchItems = async (language: 'en' | 'vi' = 'en') => {
  const response = await fetch(`/api/tft/items?lang=${language}`);
  const items = await response.json();
  return items;
};

// Create multilingual item
const createItem = async (itemData: CreateTftItemDto) => {
  const response = await fetch('/api/tft/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(itemData)
  });
  return response.json();
};
```

### Admin Dashboard Example

```typescript
// Language switcher for admin panel
const LanguageSwitcher = () => {
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchItems(language).then(setItems);
  }, [language]);

  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="vi">Tiếng Việt</option>
      </select>
      {/* Render items */}
    </div>
  );
};
```

---

## 🚀 Migration Notes

### From Single Language to Multilingual

If you have existing items in single language format, run the migration:

```bash
npm run migrate:tft-items-i18n
```

This will convert:
```json
{
  "name": "Sunfire Cape",
  "description": "Deals magic damage"
}
```

To:
```json
{
  "name": {
    "en": "Sunfire Cape",
    "vi": "Sunfire Cape"
  },
  "description": {
    "en": "Deals magic damage",
    "vi": "Deals magic damage"
  }
}
```

**Note:** After migration, manually update Vietnamese translations for better localization.

---

## 🔧 Testing

Run the test suite to verify i18n functionality:

```bash
npm run test:tft-items-i18n
```

This will test:
- ✅ Multiple language support
- ✅ Language parameter validation
- ✅ Default language fallback
- ✅ Find by name in different languages
- ✅ CRUD operations with multilingual data

---

## 📈 Performance Notes

- **Caching**: Consider caching frequently accessed items by language
- **Indexing**: MongoDB indexes on `name.en` and `name.vi` for faster searches
- **Lean Queries**: Uses `.lean()` for read operations to improve performance
- **Batch Processing**: Migration handles large datasets in batches

---

## 🔄 Integration with Other Modules

### TFT Champions
The items API integrates with TFT Champions for recommended items:

```typescript
// Champions can reference items by name
{
  "recommendedItems": [
    { "en": "Sunfire Cape", "vi": "Áo Choàng Lửa" },
    { "en": "Warmog's Armor", "vi": "Giáp Warmog" }
  ]
}
```

### Frontend Localization
Works seamlessly with i18n libraries:

```typescript
// next-i18next example
const { t, i18n } = useTranslation();
const currentLang = i18n.language; // 'en' or 'vi'

const items = await fetchItems(currentLang);
```

---

✅ **TFT Items Multilingual API is now fully functional and ready for production use!** 