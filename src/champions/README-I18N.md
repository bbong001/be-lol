# Champions Internationalization (i18n) Guide

## 🌍 Overview

The Champions module now supports internationalization with **English (en)** and **Vietnamese (vi)** languages. This allows users to request champion data in their preferred language.

## 📊 Supported Languages

- `en` - English (Default)
- `vi` - Vietnamese (Tiếng Việt)

## 🚀 API Usage

### Query Parameter

Add `?lang=vi` or `?lang=en` to any endpoint to get data in the specified language.

### Endpoints with i18n Support

#### 1. Get All Champions
```bash
GET /champions?lang=vi&page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "name": "Ahri",
      "title": "Cửu Vĩ Hồ",
      "id": "Ahri",
      "imageUrl": "...",
      "stats": {...},
      "abilities": [...]
    }
  ],
  "total": 168,
  "page": 1,
  "limit": 20,
  "totalPages": 9
}
```

#### 2. Get Champion by Name
```bash
GET /champions/name/Ahri?lang=vi
```

#### 3. Get Champion Details
```bash
GET /champions/details/Ahri?lang=en
```

#### 4. Get Champion by ID
```bash
GET /champions/64a1b2c3d4e5f6789?lang=vi
```

## 🏗️ Database Schema

The multilingual data is stored in MongoDB with this structure:

```typescript
{
  name: {
    en: "Ahri",
    vi: "Ahri"
  },
  title: {
    en: "the Nine-Tailed Fox", 
    vi: "Cửu Vĩ Hồ"
  },
  abilities: [
    {
      name: {
        en: "Orb of Deception",
        vi: "Quả Cầu Lừa Dối"
      },
      description: {
        en: "Ahri sends out...",
        vi: "Ahri tung ra..."
      }
    }
  ]
}
```

## 🔧 Implementation Details

### Transform Functions

The i18n utility provides transform functions:

```typescript
import { transformChampion, validateLanguage } from './utils/i18n.util';

// Transform single champion
const champion = transformChampion(dbChampion, 'vi');

// Validate language parameter
const lang = validateLanguage(req.query.lang); // Returns 'en' or 'vi'
```

### Service Methods

All service methods now accept an optional `lang` parameter:

```typescript
// ChampionsService methods
findAll(page, limit, lang = 'en')
findById(id, lang = 'en') 
findByName(name, lang = 'en')
findDetailsByName(name, lang = 'en')
```

## 📝 Data Sync

### Sync from Riot API

The sync process now fetches data from both language endpoints:

```bash
npm run champions:sync
```

This will:
1. Fetch champion data from English Data Dragon API
2. Fetch champion data from Vietnamese Data Dragon API  
3. Combine both datasets into multilingual schema
4. Save to MongoDB

### Manual Data Update

```typescript
// Sync champions with multilingual support
await championsService.syncFromRiotApi();
```

## 🧪 Testing

### Run Demo Script

```bash
npm run demo:champions-i18n
```

This will:
- Sync champions from Riot API
- Test finding champions in English
- Test finding champions in Vietnamese
- Show API usage examples

### Manual Testing

```bash
# Test English (default)
curl "http://localhost:3000/champions?page=1&limit=5"

# Test Vietnamese
curl "http://localhost:3000/champions?lang=vi&page=1&limit=5"

# Test champion search in Vietnamese
curl "http://localhost:3000/champions/name/Ahri?lang=vi"
```

## 🔍 Search Capabilities

The search functionality works across both languages:

```typescript
// These searches will find "Ahri":
findByName("Ahri", "vi")     // Search by English name
findByName("아리", "vi")       // Search by Korean name (if available)
findByName("Ahri", "en")     // Search by English name
```

## ⚡ Performance Considerations

- Language transformation happens in-memory (fast)
- Database stores both languages in single document (efficient)
- Default language is English if parameter missing
- No additional database queries needed for different languages

## 🔮 Future Enhancements

Potential improvements:
- Add more languages (Korean, Chinese, etc.)
- Language-specific champion builds/guides
- Auto-detect user language from headers
- Cache transformed data for better performance

## 🐛 Troubleshooting

### Common Issues

1. **Missing Vietnamese data**: Some champions might not have Vietnamese translations
   - Falls back to English automatically

2. **Invalid language parameter**: 
   - Invalid `lang` values default to English

3. **Data sync issues**:
   - Check internet connection to Riot APIs
   - Verify API endpoints are accessible

### Debug Mode

Enable debug logging:
```typescript
console.log('Language requested:', lang);
console.log('Transformed champion:', transformedChampion);
``` 