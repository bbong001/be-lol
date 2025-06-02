# Champion Counter Data Crawler

Hệ thống crawl dữ liệu counter cho tất cả champion từ kicdo.com dựa trên champion schema.

## 🎯 Mục đích

Script này cho phép bạn crawl dữ liệu counter cho:
- **Tất cả champion** có trong database
- **Champion phổ biến** (top picks mỗi role)
- **Champion cụ thể** bạn muốn chọn

## 📋 Yêu cầu

1. **Database có sẵn champion data**: Cần sync champions từ Riot API trước
2. **MongoDB đang chạy**: Để lưu trữ dữ liệu counter
3. **Internet connection**: Để crawl từ kicdo.com

## 🚀 Cách sử dụng

### 1. Crawl tất cả champion (⚠️ Mất nhiều thời gian)

```bash
npm run crawl:champions-counter-data
```

**Tính năng:**
- Crawl tất cả champion có trong database
- Tự động xác định role phù hợp cho từng champion
- Xử lý theo batch để tránh overload server
- Có retry logic và error handling
- Hiển thị progress và summary

**Thời gian:** ~2-4 giờ cho 160+ champions

### 2. Crawl champion phổ biến (⭐ Khuyến nghị)

```bash
npm run crawl:champions-counter-data:popular
```

**Champion được crawl:**
- **Jungle**: Graves, Kindred, Hecarim, RekSai
- **Mid**: Yasuo, Yone, Akali, Zed, Ahri
- **ADC**: Jinx, Caitlyn, Vayne, Ezreal, KaiSa
- **Support**: Thresh, Leona, Nautilus, Pyke
- **Top**: Fiora, Camille, Garen, Darius, Irelia

**Thời gian:** ~30-45 phút

### 3. Crawl champion cụ thể

```bash
npm run crawl:champions-counter-data:specific Yasuo Jinx Thresh
```

**Ví dụ khác:**
```bash
# Crawl một champion
npm run crawl:champions-counter-data:specific Yasuo

# Crawl nhiều champion
npm run crawl:champions-counter-data:specific Yasuo Yone Akali Zed

# Crawl team comp
npm run crawl:champions-counter-data:specific Graves Yasuo Jinx Thresh Garen
```

## 📊 Role Mapping Logic

### Automatic Role Detection

Script tự động xác định role dựa trên champion tags:

```typescript
const ROLE_MAPPINGS = {
  jungle: ['Jungle'],
  top: ['Top', 'Tank', 'Fighter'],
  mid: ['Mage', 'Assassin'],
  adc: ['Marksman'],
  support: ['Support'],
};
```

### Manual Role Overrides

Một số champion có role được định nghĩa manual:

```typescript
const CHAMPION_ROLE_OVERRIDES = {
  // Jungle specific
  Graves: ['jungle'],
  Kindred: ['jungle'],
  
  // Multi-role champions
  Yasuo: ['mid', 'top'],
  Yone: ['mid', 'top'],
  Pyke: ['support', 'mid'],
  
  // ADC
  Jinx: ['adc'],
  Caitlyn: ['adc'],
  
  // Support
  Thresh: ['support'],
  Leona: ['support'],
};
```

## 📈 Output & Monitoring

### Console Output Mẫu

```
🚀 Starting comprehensive champion counter data crawling...

📊 Fetching all champions from database...
Found 160 champions in database

📋 Crawling plan:
  Yasuo (Yasuo): mid, top
  Jinx (Jinx): adc
  Thresh (Thresh): support
  ...

🎯 Total crawl tasks: 245

📦 Processing batch 1/32

🔍 Crawling Yasuo (Yasuo)...
  ➡️ Role: mid
  ✅ Successfully crawled Yasuo mid
  ➡️ Role: top
  ✅ Successfully crawled Yasuo top

============================================================
📊 CRAWLING SUMMARY
============================================================
✅ Successful crawls: 240
❌ Failed crawls: 5
📈 Success rate: 98.0%
```

### Error Handling

- **Retry Logic**: 3 lần retry với exponential backoff
- **Continue on Error**: Lỗi một champion không ảnh hưởng đến champion khác
- **Error Summary**: Hiển thị tất cả lỗi ở cuối
- **Timeout Protection**: Timeout 30s cho mỗi request

## 🔧 Configuration

### Tùy chỉnh thông số crawl

Trong file `crawl-champions-counter-data.ts`:

```typescript
// Thay đổi batch size (default: 5)
const BATCH_SIZE = 3; // Giảm xuống nếu server chậm

// Thay đổi delay giữa request (default: 2000ms)
await sleep(3000); // Tăng lên nếu bị rate limit

// Thay đổi delay giữa batch (default: 10000ms)
await sleep(15000); // Tăng lên để tránh overload

// Thay đổi patch và rank
await counterCrawlerService.crawlCounterData(
  champion.id,
  role,
  '15.10', // ← Patch hiện tại
  'Emerald+', // ← Rank target
);
```

### Thêm champion vào role overrides

```typescript
const CHAMPION_ROLE_OVERRIDES = {
  // Thêm champion mới
  YourChampion: ['mid', 'jungle'],
  
  // Cập nhật champion có sẵn
  Yasuo: ['mid', 'top', 'adc'], // Thêm adc role
};
```

## 🛡️ Best Practices

### 1. Sync Champions Trước

```bash
npm run sync:champions
```

### 2. Test với Champion Cụ Thể Trước

```bash
npm run crawl:champions-counter-data:specific Yasuo
```

### 3. Crawl Popular Champions Trước

```bash
npm run crawl:champions-counter-data:popular
```

### 4. Monitor Logs

- Theo dõi success rate
- Check error messages
- Restart nếu quá nhiều lỗi

### 5. Database Backup

```bash
# Backup trước khi crawl
mongodump --db your_database_name

# Restore nếu cần
mongorestore --db your_database_name dump/your_database_name
```

## 📊 Data Structure

Mỗi champion-role sẽ tạo ra một document với structure:

```typescript
{
  championId: "Yasuo",
  championName: "Yasuo", 
  role: "mid",
  overallWinRate: 52.2,
  pickRate: 90.0,
  banRate: 15.3,
  
  // Counter relationships
  weakAgainst: [
    {
      championId: "Malzahar",
      championName: "Malzahar",
      winRate: 58.5,
      counterRating: 8.2,
      gameCount: 1249,
      goldDifferentialAt15: -245,
      difficulty: "Hard",
      tips: "Malzahar can suppress Yasuo and prevent his mobility",
    }
  ],
  
  strongAgainst: [...],
  bestLaneCounters: [...],
  worstLaneCounters: [...],
  
  // HTML content
  weaknessesContent: "<p>Yasuo điểm yếu...</p>",
  counterItemsContent: "<ul><li>Thornmail...</li></ul>",
  strategiesContent: "<ul><li>Focus CC...</li></ul>",
  additionalTipsContent: "<ul><li>Ban Yasuo...</li></ul>",
  
  // Metadata
  patch: "15.10",
  rank: "Emerald+",
  region: "World",
  lastUpdated: "2025-01-15T10:30:00.000Z"
}
```

## 🔍 Troubleshooting

### Lỗi thường gặp:

#### "No champions found in database"
```bash
# Sync champions từ Riot API
npm run sync:champions
```

#### "Connection timeout"
```typescript
// Tăng timeout trong crawler service
timeout: 60000 // từ 30000 lên 60000
```

#### "Too many requests"
```typescript
// Tăng delay giữa requests
await sleep(5000); // từ 2000 lên 5000
```

#### "Champion not found: XYZ"
- Check champion ID trong database
- Có thể champion chưa được sync
- Check spelling của champion name

## 📝 Log Files

Script không tạo log file, tất cả output hiển thị trên console. Để save logs:

```bash
# Save tất cả output
npm run crawl:champions-counter-data > crawl.log 2>&1

# Save chỉ errors
npm run crawl:champions-counter-data 2> errors.log

# Save cả output và errors
npm run crawl:champions-counter-data > crawl.log 2>&1
```

## 🔄 Updating Data

Để update data cho champion đã có:

1. **Xóa data cũ** (optional):
```typescript
await counterService.removeByChampionAndRole(championId, role);
```

2. **Crawl lại**:
```bash
npm run crawl:champions-counter-data:specific Yasuo
```

Script sẽ tự động skip nếu data đã tồn tại, trừ khi bạn xóa manual.

## ⚡ Performance Tips

1. **Chạy trên server mạnh**: RAM ít nhất 4GB
2. **Stable internet**: Tránh crawl khi mạng không ổn định  
3. **Monitor memory**: Kill script nếu memory leak
4. **Run off-peak hours**: Tránh crawl khi traffic cao
5. **Use specific crawl**: Thay vì crawl all, crawl từng batch nhỏ

✅ **Happy crawling! 🚀** 