console.log('🚀 PC Build CREATE & UPDATE Test Demo\n');

// Demo data for CREATE
const createBuildData = {
  name: 'Gaming PC Build 2024',
  description: 'High-performance gaming setup for 2024',
  content: `# Gaming PC Build 2024

## Components

### CPU
- Intel Core i7-13700K
- 16 cores (8P + 8E)
- Max Boost: 5.4 GHz

### GPU  
- NVIDIA GeForce RTX 4070 Ti
- 12GB GDDR6X
- Boost Clock: 2610 MHz

### RAM
- 32GB DDR5-5200
- Corsair Vengeance RGB

### Storage
- 1TB NVMe SSD Samsung 980 PRO

### Motherboard
- ASUS TUF Gaming Z790-Plus

## Estimated Cost
- Total: ~$2,500 USD

## Performance
- 1440p Ultra Gaming: 90+ FPS
- 4K Gaming: 60+ FPS`,
  imageUrl: 'https://example.com/gaming-pc.jpg',
  tags: ['gaming', 'high-end', '1440p', 'rtx-4070-ti'],
  isPublic: true,
  lang: 'vi',
};

// Demo data for UPDATE
const updateBuildData = {
  name: 'Updated Gaming PC Build 2024',
  description: 'Updated high-performance gaming setup',
  tags: ['gaming', 'updated', 'premium'],
  isPublic: false,
};

console.log('📝 CREATE Test Data:');
console.log(JSON.stringify(createBuildData, null, 2));
console.log('\n');

console.log('📝 UPDATE Test Data:');
console.log(JSON.stringify(updateBuildData, null, 2));
console.log('\n');

console.log('🔧 Test Scenarios:');
console.log('');

console.log('1️⃣ CREATE Tests:');
console.log('   ✅ Create Vietnamese PC build');
console.log('   ✅ Create English PC build');
console.log('   ✅ Create with default language (vi)');
console.log('   ❌ Create without admin role (403)');
console.log('   ❌ Create with invalid data (400)');
console.log('');

console.log('2️⃣ UPDATE Tests:');
console.log('   ✅ Update by owner');
console.log('   ✅ Partial update (only name)');
console.log('   ❌ Update by different user (403)');
console.log('   ❌ Update non-existent build (404)');
console.log('   ❌ Update with invalid data (400)');
console.log('');

console.log('🌐 API Endpoints to Test:');
console.log('');
console.log('CREATE:');
console.log('POST /pc-build/builds');
console.log('Headers: Authorization: Bearer <admin_token>');
console.log('Body: createBuildData');
console.log('');

console.log('UPDATE:');
console.log('PUT /pc-build/builds/:id');
console.log('Headers: Authorization: Bearer <owner_token>');
console.log('Body: updateBuildData');
console.log('');

console.log('READ (for verification):');
console.log('GET /pc-build/builds/:id');
console.log('GET /pc-build/builds?lang=vi');
console.log('');

console.log('🔑 Authentication Requirements:');
console.log('- CREATE: Admin role required');
console.log('- UPDATE: Owner or Admin required');
console.log('- READ: Public access');
console.log('');

console.log('📊 Expected Responses:');
console.log('');
console.log('✅ Success (201/200):');
console.log(`{
  "status": "success",
  "data": {
    "_id": "...",
    "name": "Gaming PC Build 2024",
    "description": "...",
    "content": "...",
    "tags": [...],
    "isPublic": true,
    "lang": "vi",
    "user": {...},
    "createdAt": "...",
    "updatedAt": "..."
  }
}`);
console.log('');

console.log('❌ Error (400/401/403/404):');
console.log(`{
  "statusCode": 403,
  "message": "You are not authorized to update this build",
  "error": "Forbidden"
}`);
console.log('');

console.log('🧪 How to Test:');
console.log('1. Start server: npm run start:dev');
console.log('2. Create admin user and get JWT token');
console.log('3. Use Postman/curl to test endpoints');
console.log('4. Or run integration tests: npm run test:pc-build-lang');
console.log('');

console.log('✨ Test Demo Completed!');
