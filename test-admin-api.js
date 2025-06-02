const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testAdminFunctions() {
  console.log('🚀 Starting Admin API Tests...\n');

  try {
    // Step 1: Register Admin (if not exists)
    console.log('📝 Step 1: Registering admin...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register-admin`, {
        name: 'admin',
        email: 'admin@admin.com',
        password: 'Admin@123'
      });
      console.log('✅ Admin registered successfully');
      console.log('Response:', registerResponse.data);
    } catch (error) {
      console.log('ℹ️ Admin might already exist:', error.response?.data?.message || 'Unknown error');
    }

    // Step 2: Login Admin
    console.log('\n🔐 Step 2: Logging in admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@admin.com',
      password: 'Admin@123'
    });
    console.log('✅ Admin login successful');
    const accessToken = loginResponse.data.access_token || loginResponse.data.accessToken;
    console.log('Token:', accessToken.substring(0, 50) + '...');

    // Setup headers with auth token
    const authHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Step 3: Create News Article
    console.log('\n📰 Step 3: Creating news article...');
    const articleData = {
      title: 'Hướng dẫn chơi Yasuo mùa 14 - Test Admin',
      content: `# Yasuo - Kiếm sĩ vô danh

Yasuo là một tướng khó chơi nhưng rất mạnh khi thành thạo...

## Kỹ năng:
- Q: Bão thép - Tấn công xuyên suốt
- W: Bức tường gió - Chặn đạn
- E: Lưỡi kiếm đằng sau - Di chuyển qua minion
- R: Hơi thở rồng - Ultimate mạnh mẽ

## Build đồ:
1. Infinity Edge
2. Phantom Dancer  
3. Bloodthirster
4. Guardian Angel
5. Mortal Reminder
6. Berserker's Greaves

## Lời khuyên:
- Luyện tập combo EQ Flash
- Sử dụng Wind Wall đúng lúc
- Tận dụng passive Shield
- Farm an toàn trong early game`,
      summary: 'Hướng dẫn chi tiết cách chơi Yasuo hiệu quả cho người mới bắt đầu',
      imageUrl: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Yasuo.png',
      tags: ['yasuo', 'guide', 'lol', 'mid', 'admin-test'],
      published: true,
      lang: 'vi'
    };

    const articleResponse = await axios.post(`${BASE_URL}/news`, articleData, { headers: authHeaders });
    console.log('✅ Article created successfully');
    console.log('Article ID:', articleResponse.data.data._id);
    console.log('Article Slug:', articleResponse.data.data.slug);
    const articleId = articleResponse.data.data._id;
    const articleSlug = articleResponse.data.data.slug;

    // Step 4: Create PC Build
    console.log('\n💻 Step 4: Creating PC build...');
    const pcBuildData = {
      name: 'PC Gaming RTX 4060 - Admin Test Build',
      description: 'Cấu hình gaming tối ưu với RTX 4060, test bởi admin',
      content: `# Cấu hình Gaming tầm trung 2024

## Linh kiện:

### CPU: AMD Ryzen 5 5600X
- 6 nhân 12 luồng
- Xung nhịp base: 3.7GHz, Boost: 4.6GHz
- Giá: 4,500,000 VNĐ

### GPU: RTX 4060 8GB
- VRAM: 8GB GDDR6
- Chơi 1080p High/Ultra 60fps
- Hỗ trợ DLSS 3
- Giá: 9,500,000 VNĐ

### RAM: G.Skill Ripjaws V 16GB DDR4-3200
- Dung lượng: 16GB (2x8GB)
- Bus: 3200MHz
- Giá: 1,800,000 VNĐ

### SSD: Kingston NV2 500GB M.2 NVMe
- Dung lượng: 500GB
- Tốc độ đọc: 3,500 MB/s
- Giá: 1,200,000 VNĐ

## Tổng giá: ~21,500,000 VNĐ

## Đánh giá:
- ✅ Chơi được tất cả game hiện tại ở 1080p
- ✅ Có thể upgrade sau này
- ✅ Giá cả hợp lý
- ⚠️ Chỉ phù hợp với 1080p gaming`,
      imageUrl: 'https://example.com/rtx4060-build.jpg',
      tags: ['gaming', 'rtx4060', 'mid-range', '2024', 'admin-test'],
      isPublic: true,
      lang: 'vi'
    };

    const pcBuildResponse = await axios.post(`${BASE_URL}/pc-build/builds`, pcBuildData, { headers: authHeaders });
    console.log('✅ PC Build created successfully');
    console.log('PC Build ID:', pcBuildResponse.data.data._id);
    const pcBuildId = pcBuildResponse.data.data._id;

    // Step 5: Create Comments
    console.log('\n💬 Step 5: Creating comments...');
    
    // Comment on article
    const articleCommentData = {
      content: 'Bài viết rất chi tiết! Yasuo thực sự là tướng khó nhưng rất thú vị. Cảm ơn admin đã chia sẻ!'
    };
    const articleCommentResponse = await axios.post(`${BASE_URL}/comments/news/${articleId}`, articleCommentData, { headers: authHeaders });
    console.log('✅ Comment on article created');
    console.log('Article Comment ID:', articleCommentResponse.data.data._id);

    // Comment on PC build
    const pcBuildCommentData = {
      content: 'Cấu hình này rất tốt cho tầm giá! RTX 4060 hiện tại là lựa chọn tối ưu cho 1080p gaming.'
    };
    const pcBuildCommentResponse = await axios.post(`${BASE_URL}/comments/pc-build/${pcBuildId}`, pcBuildCommentData, { headers: authHeaders });
    console.log('✅ Comment on PC build created');
    console.log('PC Build Comment ID:', pcBuildCommentResponse.data.data._id);

    // Step 6: Test Admin-only endpoints
    console.log('\n🔧 Step 6: Testing admin-only endpoints...');
    
    // Get all articles (admin view)
    const adminArticlesResponse = await axios.get(`${BASE_URL}/news/admin?limit=5&page=1&lang=vi`, { headers: authHeaders });
    console.log('✅ Admin articles retrieved');
    console.log('Total articles:', adminArticlesResponse.data.data.total);

    // Get all PC builds (admin view)
    const adminPcBuildsResponse = await axios.get(`${BASE_URL}/pc-build/admin?limit=5&page=1&lang=vi`, { headers: authHeaders });
    console.log('✅ Admin PC builds retrieved');
    console.log('Total PC builds:', adminPcBuildsResponse.data.data.total);

    // Step 7: Update Article
    console.log('\n📝 Step 7: Updating article...');
    const updateData = {
      title: 'Hướng dẫn chơi Yasuo mùa 14 - UPDATED BY ADMIN',
      summary: 'Hướng dẫn chi tiết cách chơi Yasuo hiệu quả - Đã được cập nhật bởi admin'
    };
    const updateResponse = await axios.put(`${BASE_URL}/news/${articleSlug}`, updateData, { headers: authHeaders });
    console.log('✅ Article updated successfully');

    console.log('\n🎉 All Admin Tests Completed Successfully! 🎉');
    console.log('\n📊 Summary:');
    console.log('- ✅ Admin registered/logged in');
    console.log('- ✅ News article created');
    console.log('- ✅ PC build created');
    console.log('- ✅ Comments created');
    console.log('- ✅ Admin endpoints tested');
    console.log('- ✅ Article updated');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

// Run the tests
testAdminFunctions(); 