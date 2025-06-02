# TFT Admin API Guide - Champion Updates

## 🛡️ Authentication Required
All update operations require **admin authentication** with JWT token.

```
Authorization: Bearer <your_jwt_token>
```

## 📝 PUT /tft/champions/:id

Update TFT champion information by ID.

### URL Parameters
- `id` (string, required): MongoDB ObjectId of the champion

### Request Body
All fields are **optional** - you can update only the fields you need to change.

```typescript
{
  // Basic Information
  "name"?: {
    "en": "English Name",
    "vi": "Tên Tiếng Việt"
  },
  "cost"?: 1,                    // Champion cost (1-5)
  "patch"?: "14.24.1",           // Current patch version
  "setNumber"?: 14,              // TFT Set number
  "imageUrl"?: "https://...",    // Champion image URL

  // Traits (Origin/Class)
  "traits"?: [
    {
      "en": "Golden Ox",
      "vi": "Bò Vàng"
    },
    {
      "en": "Bruiser", 
      "vi": "Võ Sĩ"
    }
  ],

  // Champion Ability
  "ability"?: {
    "name": {
      "en": "Pulverize",
      "vi": "Nghiền Nát"
    },
    "description": {
      "en": "Ability description",
      "vi": "Mô tả kỹ năng"
    },
    "mana": "40"                 // Mana cost
  },

  // Champion Stats
  "stats"?: {
    "health": "700",
    "mana": "40", 
    "armor": "35",
    "magicResist": "35",
    "dps": "36.8",
    "damage": "55",
    "attackSpeed": "0.65",
    "critRate": "25%",
    "range": "1"
  },

  // Recommended Items
  "recommendedItems"?: [
    {
      "en": "Gargoyle Stoneplate",
      "vi": "Giáp Thạch Quỷ"
    },
    {
      "en": "Warmog's Armor",
      "vi": "Giáp Warmog"
    }
  ],

  // Recommended Items with Images
  "recommendedItemsData"?: [
    {
      "name": {
        "en": "Gargoyle Stoneplate",
        "vi": "Giáp Thạch Quỷ"
      },
      "imageUrl": "https://cdn.example.com/item.png"
    }
  ]
}
```

## 🔧 Example Usage

### 1. Update Champion Cost Only
```bash
curl -X PUT "http://localhost:3000/tft/champions/682da7840cb5991bc650c7fe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "cost": 3
  }'
```

### 2. Update Champion Name
```bash
curl -X PUT "http://localhost:3000/tft/champions/682da7840cb5991bc650c7fe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": {
      "en": "Updated Champion Name",
      "vi": "Tên Tướng Đã Cập Nhật"
    }
  }'
```

### 3. Update Traits
```bash
curl -X PUT "http://localhost:3000/tft/champions/682da7840cb5991bc650c7fe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "traits": [
      {
        "en": "Golden Ox",
        "vi": "Bò Vàng"
      },
      {
        "en": "Bruiser",
        "vi": "Võ Sĩ"
      }
    ]
  }'
```

### 4. Update Recommended Items
```bash
curl -X PUT "http://localhost:3000/tft/champions/682da7840cb5991bc650c7fe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "recommendedItems": [
      {
        "en": "Gargoyle Stoneplate",
        "vi": "Giáp Thạch Quỷ"
      },
      {
        "en": "Warmogs Armor", 
        "vi": "Giáp Warmog"
      }
    ]
  }'
```

### 5. Full Champion Update
```bash
curl -X PUT "http://localhost:3000/tft/champions/682da7840cb5991bc650c7fe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": {
      "en": "Alistar",
      "vi": "Alistar"
    },
    "cost": 1,
    "traits": [
      {
        "en": "Golden Ox",
        "vi": "Bò Vàng"
      },
      {
        "en": "Bruiser",
        "vi": "Võ Sĩ"
      }
    ],
    "ability": {
      "name": {
        "en": "Pulverize",
        "vi": "Nghiền Nát"
      },
      "description": {
        "en": "Knocks up nearby enemies",
        "vi": "Hất tung kẻ địch gần đó"
      },
      "mana": "40"
    },
    "stats": {
      "health": "700",
      "mana": "40",
      "armor": "35",
      "magicResist": "35"
    },
    "recommendedItems": [
      {
        "en": "Gargoyle Stoneplate",
        "vi": "Giáp Thạch Quỷ"
      }
    ],
    "patch": "14.24.1",
    "setNumber": 14
  }'
```

## 📊 Response Format

### Success Response (200)
```json
{
  "_id": "682da7840cb5991bc650c7fe",
  "name": {
    "en": "Alistar",
    "vi": "Alistar"
  },
  "cost": 1,
  "traits": [
    {
      "en": "Golden Ox",
      "vi": "Bò Vàng"
    }
  ],
  "patch": "14.24.1",
  "setNumber": 14,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

#### 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

#### 401 - Unauthorized  
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### 403 - Forbidden (Not Admin)
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

#### 404 - Champion Not Found
```json
{
  "statusCode": 404,
  "message": "TFT Champion with ID 682da7840cb5991bc650c7fe not found"
}
```

## 🌐 Language Support

All text fields support both English (`en`) and Vietnamese (`vi`):
- `name`
- `traits[].en` and `traits[].vi`
- `ability.name` and `ability.description`
- `recommendedItems[].en` and `recommendedItems[].vi`
- `recommendedItemsData[].name`

## ⚠️ Important Notes

1. **Partial Updates**: You only need to send the fields you want to update
2. **Array Fields**: When updating arrays (traits, recommendedItems), send the complete new array
3. **Validation**: All fields are validated according to the schema
4. **Authentication**: Admin JWT token is required
5. **ID Format**: Champion ID must be a valid MongoDB ObjectId

## 🔗 Related Endpoints

- `GET /tft/champions` - List all champions
- `GET /tft/champions/:id` - Get champion by ID
- `POST /tft/champions` - Create new champion (Admin only)
- `DELETE /tft/champions/:id` - Delete champion (Admin only)

## 🛠️ Testing

Use the test script to verify functionality:
```bash
npm run test:tft-put-endpoint
```

## 📝 Validation Rules

- `name`: Required object with `en` and `vi` strings
- `cost`: Number between 1-5
- `traits`: Array of objects with `en` and `vi` strings
- `ability.mana`: String representing mana cost
- `stats.*`: All stat fields are optional strings
- `patch`: String representing patch version
- `setNumber`: Number representing TFT set
- `imageUrl`: Valid URL string 