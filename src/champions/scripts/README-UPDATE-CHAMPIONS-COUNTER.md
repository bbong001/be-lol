# Update All Champions Counter Data Script

Đây là script để cập nhật counter data cho tất cả champions từ database champion.schema. Script sẽ tự động lấy danh sách champions từ database và crawl counter data từ kicdo.com.

## 🚀 Cách sử dụng

### 1. Cập nhật tất cả champions (mặc định)

```bash
npm run update:all-champions-counter
```

Sẽ crawl counter data cho tất cả champions trong database, bỏ qua những champion đã có counter data.

### 2. Chỉ crawl popular champions

```bash
npm run update:all-champions-counter:popular
```

Chỉ crawl counter data cho các champions phổ biến dựa trên meta hiện tại.

### 3. Crawl champions cụ thể

```bash
npm run update:all-champions-counter:specific --champions="Zeri,Caitlyn,Jinx"
```

Crawl counter data cho các champions được chỉ định.

### 4. Cập nhật counter data đã tồn tại

```bash
npm run update:all-champions-counter:update
```

Cập nhật lại counter data cho những champions đã có data trong database.

### 5. Tùy chỉnh thêm

```bash
# Crawl với batch size khác (mặc định 5)
npm run update:all-champions-counter -- --batch=3

# Kết hợp nhiều tùy chọn
npm run update:all-champions-counter -- --popular --update --batch=2
```

## 📋 Tham số

| Tham số | Mô tả | Ví dụ |
|---------|-------|-------|
| `--popular` | Chỉ crawl champions phổ biến | `--popular` |
| `--specific` | Crawl champions cụ thể | `--specific --champions="Zeri,Jinx"` |
| `--update` | Cập nhật data đã tồn tại | `--update` |
| `--batch=N` | Kích thước batch (mặc định 5) | `--batch=3` |
| `--champions="name1,name2"` | Danh sách champions | `--champions="Zeri,Caitlyn"` |

## 🎯 Tính năng

### ✅ Tự động xác định role chính
Script sử dụng mapping thông minh để xác định role chính của mỗi champion:

1. **Ưu tiên**: Mapping role cụ thể theo meta
2. **Dự phòng**: Dựa trên tags của champion
3. **Mặc định**: mid lane

### ✅ Batch processing
- Xử lý champions theo từng batch để tránh quá tải server
- Delay thông minh giữa các request (3s/request, 15s/batch)
- Retry mechanism khi gặp lỗi

### ✅ Kiểm tra dữ liệu tồn tại
- Tự động bỏ qua champions đã có counter data (trừ khi có `--update`)
- Hiển thị summary chi tiết về kết quả crawl

### ✅ Error handling
- Log chi tiết các lỗi xảy ra
- Tiếp tục crawl các champions khác khi gặp lỗi
- Summary tổng hợp ở cuối

## 📊 Champion Role Mapping

### ADC Champions
Jinx, Caitlyn, Zeri, Ezreal, Vayne, Ashe, Jhin, Kai'Sa, Lucian, Tristana, Sivir, Kog'Maw, Twitch, Varus, Draven, Miss Fortune, Samira, Aphelios, Xayah

### Jungle Champions  
Graves, Kindred, Kha'Zix, Hecarim, Ekko, Evelynn, Nidalee, Elise, Lillia, Kayn, Master Yi, Viego, Diana, Fiddlesticks, Warwick, Shyvana, Ammu, Rammus, Nunu & Willump, Ivern, Briar, Rek'Sai, Jarvan IV, Volibear, Udyr, Lee Sin, Sejuani, Zac

### Support Champions
Thresh, Blitzcrank, Leona, Braum, Alistar, Nautilus, Pyke, Rakan, Lulu, Janna, Soraka, Nami, Sona, Yuumi, Karma, Morgana, Zyra, Vel'Koz, Brand, Xerath, Zilean, Bard, Taric, Senna, Seraphine, Renata

### Top Lane Champions
Darius, Garen, Fiora, Camille, Jax, Irelia, Riven, Aatrox, Shen, Malphite, Ornn, Maokai, Sion, Cho'Gath, Nasus, Renekton, Kled, Urgot, Singed, Teemo, Kennen, Gnar, Jayce, Gangplank, Tryndamere, Yorick, Illaoi, Mordekaiser, Dr. Mundo, Poppy, Tahm, Gragas

### Mid Lane Champions
Yasuo, Yone, Zed, Talon, Katarina, Akali, LeBlanc, Fizz, Kassadin, Ahri, Lux, Syndra, Orianna, Azir, Ryze, Cassiopeia, Twisted Fate, Zoe, Neeko, Sylas, Qiyana, Akshan, Vex, Viktor, Ziggs, Anivia, Malzahar, Aurelion Sol, Galio, Corki, Heimerdinger, Swain

## 🔧 Cấu hình

### Database Requirements
- Champions phải được sync từ Riot API trước:
```bash
npm run sync:champions
```

### Counter Data Structure
Script sẽ tạo counter data với các thông tin:
- `weakAgainst`: Champions counter champion này
- `strongAgainst`: Champions bị champion này counter
- `bestLaneCounters`: Best early game counters
- `worstLaneCounters`: Worst early game matchups
- `formattedContent`: HTML content chi tiết
- `weaknessesContent`: Điểm yếu của champion
- `counterItemsContent`: Trang bị khắc chế
- `strategiesContent`: Chiến thuật đối đầu
- `additionalTipsContent`: Tips bổ sung

## 📈 Ví dụ Output

```
🚀 Starting Update All Champions Counter Data
============================================================
📋 Command Arguments:
   - Specific champions only: false
   - Popular champions only: true
   - Update existing: false
   - Batch size: 5
   - Champion filter: None

📊 Fetching champions from database...
✅ Found 168 champions in database
🔥 Filtered to 89 popular champions
📈 Processing 89 champions

📦 Processing Batch 1/18 (5 champions)
--------------------------------------------------

[1/89] 🔍 Processing Jinx...
  📋 Primary role: adc
  🔄 Crawling counter data for Jinx (adc)...
  ✅ Successfully crawled Jinx (adc)
     📊 Total counters found: 24
     🔴 Weak Against: 8
     🟢 Strong Against: 6
     🔵 Best Lane: 5
     🟡 Worst Lane: 5
```

## ⚠️ Lưu ý

1. **Rate Limiting**: Script có delay giữa các request để không spam server
2. **Patch Version**: Mặc định crawl cho patch 15.10, rank Emerald+
3. **Memory Usage**: Với số lượng lớn champions, hãy sử dụng batch size nhỏ
4. **Network**: Cần kết nối internet ổn định để crawl từ kicdo.com

## 🐛 Troubleshooting

### Lỗi "No champions found in database"
```bash
npm run sync:champions
```

### Lỗi crawl champions cụ thể
```bash
# Kiểm tra tên champion có đúng không
npm run update:all-champions-counter:specific --champions="Kai'Sa,Kog'Maw"
```

### Crawl bị timeout
```bash
# Giảm batch size
npm run update:all-champions-counter -- --batch=2
```

## 📚 Tài liệu liên quan

- [Counter Schema](../schemas/counter.schema.ts)
- [Champion Schema](../schemas/champion.schema.ts)
- [Counter Crawler Service](../services/counter-crawler.service.ts)
- [Counter Service](../services/counter.service.ts) 