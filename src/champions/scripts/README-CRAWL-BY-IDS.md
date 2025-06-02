# Crawl Counter Data theo Champion IDs

Hệ thống crawl counter data từ kicdo.com dựa theo ID của các champion trong database. Script này tuân thủ đầy đủ quy tắc từ `prompt.txt` và sử dụng dependency injection NestJS.

## 🎯 Tính năng

- ✅ Crawl counter data theo ID champions từ database
- ✅ Tự động xác định roles dựa trên tags của champion
- ✅ Hỗ trợ override roles cho champions đặc biệt
- ✅ Crawl theo batch để tránh spam server
- ✅ Retry mechanism cho tasks bị lỗi
- ✅ Delay configurable giữa requests và batches
- ✅ Filter theo championIds hoặc roles cụ thể
- ✅ Thống kê và báo cáo chi tiết

## 📁 Files

```
src/champions/scripts/
├── crawl-counter-by-champion-ids.ts    # Script crawl chính
├── check-counter-data.ts               # Script kiểm tra dữ liệu
└── README-CRAWL-BY-IDS.md              # Hướng dẫn sử dụng
```

## 🚀 Cách sử dụng

### 1. Crawl tất cả champions

```bash
npm run crawl:counter-by-ids
```

### 2. Crawl champions phổ biến

```bash
npm run crawl:counter-by-ids:popular
```

### 3. Crawl champion cụ thể

```bash
npm run crawl:counter-by-ids:specific -- Briar Graves Yasuo
```

### 4. Kiểm tra counter data đã crawl

```bash
npm run check:counter-data
```

### 5. Kiểm tra champion cụ thể

```bash
# Kiểm tra tất cả roles của Briar
npm run check:counter-data -- Briar

# Kiểm tra Briar jungle
npm run check:counter-data -- Briar jungle
```

## ⚙️ Configuration

### Role Mapping

Script tự động xác định roles dựa trên tags của champion:

```typescript
const ROLE_MAPPINGS = {
  jungle: ['Jungle'],
  top: ['Top', 'Tank', 'Fighter'],
  mid: ['Mage', 'Assassin'],
  adc: ['Marksman'],
  support: ['Support'],
};
```

### Champion Role Overrides

Các champion có roles được định nghĩa sẵn:

```typescript
const CHAMPION_ROLE_OVERRIDES = {
  // Jungle mains
  Briar: ['jungle'],
  Graves: ['jungle'],
  KhaZix: ['jungle'],
  
  // Multi-role champions
  Yasuo: ['mid', 'top'],
  Yone: ['mid', 'top'],
  Sylas: ['mid', 'jungle'],
  
  // ADC mains
  Jinx: ['adc'],
  Caitlyn: ['adc'],
  
  // Support mains
  Thresh: ['support'],
  Leona: ['support'],
  
  // Top lane mains
  Fiora: ['top'],
  Camille: ['top'],
};
```

### Crawl Options

```typescript
interface CrawlOptions {
  championIds?: string[];           // Danh sách ID champion cụ thể
  roles?: string[];                // Giới hạn roles
  patch?: string;                  // Patch version (default: '15.10')
  rank?: string;                   // Rank tier (default: 'Emerald+')
  batchSize?: number;              // Số lượng champion crawl đồng thời (default: 3)
  delayBetweenRequests?: number;   // Delay giữa các request ms (default: 3000)
  delayBetweenBatches?: number;    // Delay giữa các batch ms (default: 10000)
  retryFailed?: boolean;           // Có retry những champion bị lỗi không (default: true)
}
```

## 📊 Output Sample

### Crawl Progress
```
🚀 Bắt đầu crawl counter data theo champion IDs...

📊 Đang lấy danh sách champions từ database...
🎯 Đã filter theo IDs: Briar, Graves, Yasuo
Tìm thấy 3 champions để crawl

📋 Kế hoạch crawl:
  Briar: jungle
  Graves: jungle
  Yasuo: mid, top

🎯 Tổng số task crawl: 4
📦 Số batch: 2

📦 Xử lý batch 1/2
Tasks trong batch: 3

🔍 Crawling Briar (Briar) - Role: jungle
  ✅ Thành công: Briar jungle

🔍 Crawling Graves (Graves) - Role: jungle
  ✅ Thành công: Graves jungle

⏳ Đợi 10s trước batch tiếp theo...
```

### Summary Report
```
============================================================
📊 KẾT QUÁ CRAWL COUNTER DATA
============================================================
✅ Thành công: 4
❌ Thất bại: 0
📈 Tỷ lệ thành công: 100.0%
⏱️ Patch: 15.10
🏆 Rank: Emerald+

🎉 Hoàn thành crawl counter data!
```

### Check Data Output
```
🔍 Kiểm tra counter data đã crawl...

📊 Tổng số counter records: 45

📈 Thống kê theo role:
  jungle: 12 champions
  mid: 10 champions
  top: 8 champions
  adc: 8 champions
  support: 7 champions

🎯 Thống kê theo patch:
  15.10: 45 records

🏆 Top 10 champions có nhiều counter data nhất:
  1. Yasuo: 2 roles
  2. Yone: 2 roles
  3. Briar: 1 roles
  4. Graves: 1 roles

🔬 Kiểm tra chất lượng data:
  Có nội dung chi tiết: 40/45 (88.9%)
  Có counter champions: 42/45 (93.3%)
  Có thống kê game: 38/45 (84.4%)
```

## 🔧 Advanced Usage

### Programmatic Usage

```typescript
import { 
  crawlCounterDataByChampionIds, 
  crawlSpecificChampions, 
  crawlPopularChampions 
} from './crawl-counter-by-champion-ids';

// Crawl with custom options
await crawlCounterDataByChampionIds({
  championIds: ['Briar', 'Graves'],
  roles: ['jungle'],
  patch: '15.10',
  rank: 'Diamond+',
  batchSize: 2,
  delayBetweenRequests: 5000,
  delayBetweenBatches: 15000,
  retryFailed: true,
});

// Crawl specific champions
await crawlSpecificChampions(['Yasuo', 'Yone'], ['mid'], '15.10', 'Master+');

// Crawl popular champions
await crawlPopularChampions();
```

### Custom Role Filtering

```bash
# Chỉ crawl jungle champions
npm run crawl:counter-by-ids -- --roles jungle

# Chỉ crawl mid và top
npm run crawl:counter-by-ids -- --roles mid,top
```

## ⚠️ Lưu ý quan trọng

### Rate Limiting
- Script tự động delay giữa các requests để tránh spam server
- Sử dụng exponential backoff cho retry mechanism
- Batch processing để kiểm soát load

### Error Handling
- Tự động retry các task bị lỗi
- Lưu lại danh sách lỗi để debug
- Graceful failure - không dừng toàn bộ quá trình khi 1 champion lỗi

### Data Quality
- Tự động validate dữ liệu trước khi lưu
- Lưu raw HTML content để debug
- Structured content extraction với fallbacks

### Performance
- Sử dụng lean() queries cho MongoDB
- Index optimization cho counter schema
- Memory-efficient batch processing

## 🛠 Troubleshooting

### Lỗi thường gặp

#### 1. "Không tìm thấy champion nào trong database"
```bash
# Giải pháp: Sync champions từ Riot API trước
npm run sync:champions
```

#### 2. Network timeout/connection errors
- Script tự động retry với exponential backoff
- Tăng delay giữa requests nếu server quá tải
- Kiểm tra kết nối internet

#### 3. Champion không có counter data
- Một số champion có thể không có data trên kicdo.com
- Thử crawl với rank/patch khác
- Kiểm tra tên champion ID có đúng không

#### 4. Memory issues với dataset lớn
- Giảm batchSize
- Tăng delay giữa batches
- Restart script sau một số lượng champions nhất định

### Debug Mode

```bash
# Set NODE_ENV để có thêm debug logs
NODE_ENV=development npm run crawl:counter-by-ids
```

## 📈 Best Practices

1. **Crawl từng batch nhỏ** thay vì tất cả cùng lúc
2. **Kiểm tra dữ liệu** sau mỗi lần crawl với `check:counter-data`
3. **Backup database** trước khi crawl lượng lớn
4. **Monitor server resources** trong quá trình crawl
5. **Sử dụng specific crawl** cho testing và debugging

## 🎉 Kết luận

Script này cung cấp một giải pháp hoàn chỉnh để crawl counter data từ kicdo.com theo champion IDs, tuân thủ đầy đủ các quy tắc coding từ `prompt.txt` và đảm bảo hiệu suất, độ tin cậy cao.

✅ **Ready to use!** Hãy bắt đầu crawl counter data cho champions của bạn! 