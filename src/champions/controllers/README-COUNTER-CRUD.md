# Counter CRUD API Documentation

## Overview
This document describes the Counter CRUD API endpoints for managing champion counter data in the League of Legends application.

## Base URL
```
http://localhost:4000/api/counters
```

## Endpoints

### 1. Create Counter Data
**POST** `/counters`

Creates new counter data for a champion.

**Request Body:**
```json
{
  "championId": "aatrox",
  "championName": "Aatrox",
  "role": "top",
  "overallWinRate": 52.5,
  "pickRate": 8.2,
  "banRate": 12.1,
  "strongAgainst": [...],
  "weakAgainst": [...],
  "patch": "15.10",
  "rank": "Emerald+",
  "region": "World"
}
```

**Response:** `201 Created`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "championId": "aatrox",
  "championName": "Aatrox",
  "role": "top",
  ...
}
```

### 2. Get All Counter Data
**GET** `/counters`

Retrieves all counter data with filtering and pagination.

**Query Parameters:**
- `championId` (optional): Filter by champion ID
- `championName` (optional): Filter by champion name
- `role` (optional): Filter by role (jungle, top, mid, adc, support)
- `patch` (optional): Filter by patch version
- `rank` (optional): Filter by rank tier
- `region` (optional): Filter by region
- `limit` (optional): Number of results per page (1-100, default: 20)
- `skip` (optional): Number of results to skip (default: 0)

**Response:** `200 OK`
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### 3. Get Counter by Champion Name
**GET** `/counters/name/:championName`

Retrieves counter data for a specific champion name. Supports case-insensitive and partial name matching.

**Path Parameters:**
- `championName`: Champion name (case insensitive, supports partial matching)

**Query Parameters:**
- `role` (optional): Filter by role (jungle, top, mid, adc, support)
- `patch` (optional): Filter by patch version
- `rank` (optional): Filter by rank tier
- `region` (optional): Filter by region

**Examples:**
```
GET /counters/name/Yasuo
GET /counters/name/yasuo (case insensitive)
GET /counters/name/Yas (partial matching)
GET /counters/name/Yasuo?role=mid&patch=15.10&rank=Emerald+
```

**Response:** `200 OK`
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "championId": "yasuo",
    "championName": "Yasuo",
    "role": "mid",
    "overallWinRate": 49.2,
    "strongAgainst": [...],
    "weakAgainst": [...],
    ...
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "championId": "yasuo",
    "championName": "Yasuo",
    "role": "top",
    "overallWinRate": 47.8,
    "strongAgainst": [...],
    "weakAgainst": [...],
    ...
  }
]
```

### 4. Get Counter by Champion ID and Role
**GET** `/counters/:championId/:role`

Retrieves counter data for a specific champion ID and role.

**Path Parameters:**
- `championId`: Champion ID
- `role`: Champion role (jungle, top, mid, adc, support)

**Query Parameters:**
- `patch` (optional): Filter by patch version
- `rank` (optional): Filter by rank tier
- `region` (optional): Filter by region

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "championId": "aatrox",
  "championName": "Aatrox",
  "role": "top",
  ...
}
```

### 5. Update Counter Data
**PUT** `/counters/:id`

Updates existing counter data by ID.

**Path Parameters:**
- `id`: Counter data ID

**Request Body:**
```json
{
  "overallWinRate": 55.0,
  "pickRate": 9.5,
  "strongAgainst": [...],
  "weakAgainst": [...]
}
```

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "championId": "aatrox",
  "championName": "Aatrox",
  "overallWinRate": 55.0,
  "pickRate": 9.5,
  ...
}
```

### 6. Delete Counter Data
**DELETE** `/counters/:id`

Deletes counter data by ID.

**Path Parameters:**
- `id`: Counter data ID

**Response:** `204 No Content`

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Counter data already exists for Aatrox in top role",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Counter data not found for champion aatrox in top role",
  "error": "Not Found"
}
```

### 422 Validation Error
```json
{
  "statusCode": 422,
  "message": [
    "limit must be a number conforming to the specified constraints",
    "limit must not be greater than 100"
  ],
  "error": "Unprocessable Entity"
}
```

## Testing

### Unit Tests
```bash
npm test -- --testPathPattern=counter.controller.spec.ts
```

### Integration Tests
```bash
npm run test:counter-crud
```

### Query Validation Tests
```bash
npm run test:query-validation
```

### Counter by Name Tests
```bash
npm run test:counter-by-name
```

## Features

### Search Capabilities
- **Case Insensitive**: Search for "yasuo", "Yasuo", or "YASUO"
- **Partial Matching**: Search for "Yas" to find "Yasuo"
- **Multiple Results**: Returns array of all matching champions
- **Role Filtering**: Combine name search with specific roles

### Pagination
- Configurable page size (1-100 items)
- Skip-based pagination
- Total count and page information

### Filtering
- Filter by champion ID, name, role, patch, rank, region
- Combine multiple filters
- Case-insensitive text searches

### Validation
- Input validation with class-validator
- Type transformation for query parameters
- Comprehensive error messages

## Data Structure

### Counter Schema
```typescript
{
  championId: string;
  championName: string;
  role: 'jungle' | 'top' | 'mid' | 'adc' | 'support';
  overallWinRate?: number;
  pickRate?: number;
  banRate?: number;
  strongAgainst?: CounterRelation[];
  weakAgainst?: CounterRelation[];
  bestLaneCounters?: CounterRelation[];
  worstLaneCounters?: CounterRelation[];
  patch?: string;
  rank?: string;
  region?: string;
  formattedContent?: string;
  weaknessesContent?: string;
  counterItemsContent?: string;
  strategiesContent?: string;
  additionalTipsContent?: string;
  additionalData?: object;
  createdAt: Date;
  lastUpdated: Date;
}
```

### CounterRelation Schema
```typescript
{
  championId: string;
  championName: string;
  winRate: number;
  counterRating: number;
  gameCount: number;
  goldDifferentialAt15?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tips?: string;
  patch?: string;
  rank?: string;
  imageUrl?: string;
}
```