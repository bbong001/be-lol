# Redis Status

## 🔴 **Redis hiện đang được TẮT**

Redis đã được tạm thời vô hiệu hóa trong dự án này.

### Các thay đổi đã thực hiện:

1. **CommonModule** (`src/common/common.module.ts`):
   - Comment import `RedisCacheService`
   - Comment `RedisCacheService` trong providers và exports

2. **RedisCacheService** (`src/common/services/redis-cache.service.ts`):
   - Comment tất cả logic kết nối Redis
   - Các method trả về giá trị mặc định (null, empty array, void)
   - Giữ nguyên interface để không break code

3. **Environment variables** (`src/env.example`):
   - Comment tất cả biến môi trường Redis

### 🔄 **Cách BẬT lại Redis:**

1. **Uncomment trong CommonModule:**
   ```typescript
   import { RedisCacheService } from './services/redis-cache.service';
   // ...
   providers: [RiotApiService, RedisCacheService],
   exports: [RiotApiService, RedisCacheService],
   ```

2. **Uncomment code trong RedisCacheService:**
   - Uncomment import `Redis from 'ioredis'`
   - Uncomment logic kết nối trong `onModuleInit()`
   - Uncomment các method thực tế

3. **Uncomment biến môi trường:**
   ```
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   ```

4. **Cài lại thư viện (nếu đã uninstall):**
   ```bash
   npm install ioredis redis
   ```

### 📋 **Lưu ý:**
- Redis chưa được sử dụng trong bất kỳ service nào
- Việc tắt Redis không ảnh hưởng đến chức năng hiện tại
- Khi cần sử dụng cache, có thể inject `RedisCacheService` vào các service khác 