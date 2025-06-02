# Champion Counter System

Hệ thống phân tích counter tướng được thiết kế theo cấu trúc của kicdo.com với đầy đủ thông tin về tỷ lệ thắng, rating, số trận đấu và gold differential.

## 📁 Cấu trúc Files

```
src/champions/
├── schemas/
│   └── counter.schema.ts           # Schema cho dữ liệu counter
├── dto/
│   └── counter.dto.ts              # DTOs cho validation
├── services/
│   └── counter.service.ts          # Service xử lý logic counter
├── controllers/
│   └── counter.controller.ts       # Controller API endpoints
└── scripts/
    └── sample-counter-data.ts      # Script tạo dữ liệu mẫu
```

## 🗂️ Schema Structure

### Counter Schema
```typescript
{
  championId: string,              // ID tướng
  championName: string,            // Tên tướng
  role: string,                   // Vị trí: jungle, top, mid, adc, support
  overallWinRate: number,         // Tỷ lệ thắng tổng thể (0-100)
  pickRate: number,               // Tỷ lệ pick (0-100)
  banRate: number,                // Tỷ lệ ban (0-100)
  
  // Dữ liệu counter chi tiết
  strongAgainst: CounterRelation[],     // Tướng mà champion này counter tốt
  weakAgainst: CounterRelation[],       // Tướng counter champion này
  bestLaneCounters: CounterRelation[],  // Counter tốt nhất early game (GD@15)
  worstLaneCounters: CounterRelation[], // Matchup tệ nhất early game
  
  // Metadata
  patch: string,                    // Patch version (e.g., '15.10')
  rank: string,                     // Rank tier (e.g., 'Emerald+')
  region: string,                   // 'World', 'Korea', 'EUW', etc.
  
  // Raw HTML content storage for debugging and re-parsing
  rawHtmlContent: string,         // Full HTML content từ source page
  rawResponseData: string,        // JSON string của response gốc từ API hoặc crawl
  formattedContent: string,       // Formatted HTML content cho display (weaknesses, strategies, tips)
  
  // Separate sections for better organization
  weaknessesContent: string,      // Điểm yếu chí mạng của champion
  counterItemsContent: string,    // Trang bị khắc chế "cứng"
  strategiesContent: string,      // Chiến thuật đối đầu "cao tay"
  additionalTipsContent: string,  // Bên cạnh đó / Các lời khuyên bổ sung
  
  additionalData: {              // Dữ liệu bổ sung từ crawl
    matchupDetails: any,         // Chi tiết matchup
    itemBuildRecommendations: any, // Recommend items cho counter
    runeRecommendations: any,    // Recommend runes
    skillOrder: any,             // Thứ tự skill khuyến nghị
    playStyle: string,           // Phong cách chơi khuyến nghị
    lanePhase: any,              // Thông tin lane phase chi tiết
    teamFight: any               // Thông tin team fight
  },
  
  lastUpdated: Date,              // Cập nhật lần cuối
  createdAt: Date                 // Ngày tạo
}
```

### CounterRelation Schema
```typescript
{
  championId: string,             // ID tướng
  championName: string,           // Tên tướng
  winRate: number,               // Tỷ lệ thắng (0-100)
  counterRating: number,         // Rating counter (0-10)
  gameCount: number,             // Số trận đấu
  goldDifferentialAt15: number,  // Chênh lệch vàng ở phút 15 (có thể âm)
  difficulty: string,            // Độ khó: Easy, Medium, Hard
  tips: string,                  // Lời khuyên chơi counter
  patch: string,                 // Patch version
  rank: string,                  // Rank tier
  source: string                 // Nguồn dữ liệu
}
```

## 🔧 API Endpoints

### Base URL: `/champions/counters`

#### 1. Tạo dữ liệu counter mới
```
POST /champions/counters
Content-Type: application/json

Body: CreateCounterDto
```

#### 2. Lấy tất cả dữ liệu counter (có phân trang)
```
GET /champions/counters?limit=20&skip=0&championName=Briar&role=jungle
```

#### 3. Tìm kiếm tướng
```
GET /champions/counters/search?name=Bri
```

#### 4. Lấy thông tin meta
```
GET /champions/counters/patches          # Danh sách patch
GET /champions/counters/ranks            # Danh sách rank
GET /champions/counters/regions          # Danh sách region
GET /champions/counters/latest-patch     # Patch mới nhất
```

#### 5. Lấy dữ liệu counter theo tướng và role
```
GET /champions/counters/{championId}/{role}?patch=15.10&rank=Emerald+&region=World
```

#### 6. Lấy danh sách counter tốt nhất
```
GET /champions/counters/{championId}/{role}/best-counters
```

#### 7. Lấy matchup tệ nhất
```
GET /champions/counters/{championId}/{role}/worst-matchups
```

#### 8. Lấy thông tin early game
```
GET /champions/counters/{championId}/{role}/early-game
```

#### 9. Lấy thống kê tướng
```
GET /champions/counters/{championId}/{role}/stats
```

#### 10. Lấy nội dung đã format cho hiển thị
```
GET /champions/counters/{championId}/{role}/formatted-content
```

#### 11. Lấy từng phần nội dung riêng biệt
```
GET /champions/counters/{championId}/{role}/weaknesses      # Điểm yếu chí mạng
GET /champions/counters/{championId}/{role}/counter-items   # Trang bị khắc chế
GET /champions/counters/{championId}/{role}/strategies      # Chiến thuật đối đầu
GET /champions/counters/{championId}/{role}/additional-tips # Lời khuyên bổ sung
```

#### 12. Tìm theo tên tướng
```
GET /champions/counters/by-name/{championName}?role=jungle
```

#### 13. Cập nhật dữ liệu
```
PUT /champions/counters/{id}                    # Cập nhật theo ID
PUT /champions/counters/{championId}/{role}     # Cập nhật theo tướng & role
```

#### 14. Xóa dữ liệu
```
DELETE /champions/counters/{id}                 # Xóa theo ID
DELETE /champions/counters/{championId}/{role}  # Xóa theo tướng & role
```

## 📄 Response Format Examples

### Lấy điểm yếu (GET /champions/counters/Briar/jungle/weaknesses)
```json
{
  "championId": "Briar",
  "championName": "Briar",
  "role": "jungle",
  "sectionType": "weaknessesContent",
  "sectionName": "Điểm yếu chí mạng",
  "content": "<p>Dù sở hữu lượng hồi phục \"trâu bò\", Briar vẫn có những điểm yếu cố hữu:</p><ul><li><strong>Dễ bị thả diều:</strong> Briar thiếu kĩ năng tiếp cận cứng...</li></ul>",
  "patch": "15.10",
  "rank": "Emerald+",
  "region": "World",
  "source": "kicdo.com",
  "lastUpdated": "2025-01-15T10:30:00.000Z"
}
```

### Lấy trang bị khắc chế (GET /champions/counters/Briar/jungle/counter-items)
```json
{
  "championId": "Briar",
  "championName": "Briar",
  "role": "jungle",
  "sectionType": "counterItemsContent",
  "sectionName": "Trang bị khắc chế",
  "content": "<ul><li><strong>Giáp Gai:</strong> Hiệu ứng phản sát thương từ Giáp Gai...</li><li><strong>Tim Băng:</strong> Giảm tốc độ đánh...</li></ul>",
  "patch": "15.10",
  "rank": "Emerald+",
  "region": "World",
  "source": "kicdo.com",
  "lastUpdated": "2025-01-15T10:30:00.000Z"
}
```

### Lấy chiến thuật đối đầu (GET /champions/counters/Briar/jungle/strategies)
```json
{
  "championId": "Briar",
  "championName": "Briar",
  "role": "jungle",
  "sectionType": "strategiesContent",
  "sectionName": "Chiến thuật đối đầu",
  "content": "<ul><li><strong>Chọn tướng cơ động:</strong> Hãy ưu tiên các vị tướng như Vayne, Ezreal...</li></ul>",
  "patch": "15.10",
  "rank": "Emerald+",
  "region": "World",
  "source": "kicdo.com",
  "lastUpdated": "2025-01-15T10:30:00.000Z"
}
```

### Lấy lời khuyên bổ sung (GET /champions/counters/Briar/jungle/additional-tips)
```json
{
  "championId": "Briar",
  "championName": "Briar",
  "role": "jungle",
  "sectionType": "additionalTipsContent",
  "sectionName": "Lời khuyên bổ sung",
  "content": "<ul><li>Tập trung hạ gục Briar trước khi cô ta kịp hồi phục với nội tại.</li><li>Kêu gọi đồng đội hỗ trợ...</li></ul>",
  "patch": "15.10",
  "rank": "Emerald+",
  "region": "World",
  "source": "kicdo.com",
  "lastUpdated": "2025-01-15T10:30:00.000Z"
}
```

## 🎯 Lợi ích của việc tách riêng content sections

1. **Flexibility**: Frontend có thể lấy từng phần riêng biệt thay vì toàn bộ content
2. **Performance**: Giảm bandwidth khi chỉ cần một phần nội dung cụ thể
3. **Modularity**: Dễ dàng cache và cập nhật từng phần độc lập
4. **User Experience**: Có thể lazy load từng section khi cần
5. **SEO**: Từng section có thể được optimize riêng cho search engine

## 🔧 Tips & Best Practices

### Crawling từ kicdo.com
- Crawler tự động detect và extract các section dựa trên HTML structure
- Sử dụng multiple selectors để tăng độ chính xác extraction
- Fallback mechanism sử dụng text pattern matching nếu CSS selectors không hoạt động
- Retry logic với exponential backoff để xử lý network issues

### Sử dụng trong Frontend
```javascript
// React example
const [weaknesses, setWeaknesses] = useState('');

useEffect(() => {
  fetch('/api/champions/counters/Briar/jungle/weaknesses')
    .then(res => res.json())
    .then(data => setWeaknesses(data.content));
}, []);

return (
  <div className="weaknesses-section">
    <h3>Điểm yếu chí mạng</h3>
    <div dangerouslySetInnerHTML={{ __html: weaknesses }} />
  </div>
);
```

### Caching Strategy
```typescript
// Cache từng section riêng biệt
const cacheKey = `counter:${championId}:${role}:${sectionType}:${patch}`;
const cachedContent = await redis.get(cacheKey);

if (!cachedContent) {
  const content = await this.getContentSection(championId, role, sectionType);
  await redis.setex(cacheKey, 3600, JSON.stringify(content)); // Cache 1 hour
}
```

## 🛠 Development & Debugging

- Sử dụng `rawHtmlContent` để debug issues với HTML parsing
- `rawResponseData` để replay và test lại extraction logic
- Indexes MongoDB đã được tối ưu cho performance queries

✅ **System hoàn thiện** với khả năng lưu trữ và truy xuất từng phần nội dung riêng biệt từ kicdo.com!