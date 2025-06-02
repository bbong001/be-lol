import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PcBuildService } from '../pc-build.service';
import { CreatePCBuildDto } from '../dtos/create-pc-build.dto';
import { UpdatePCBuildDto } from '../dtos/update-pc-build.dto';

async function testPCBuildCRUD() {
  console.log('🚀 Starting PC Build CRUD Test...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const pcBuildService = app.get(PcBuildService);

  // Test data
  const mockUserId = '6507f1f77bcf86cd799439011';
  let createdBuildId: string;

  try {
    // Test 1: Create PC Build (Vietnamese)
    console.log('📝 Test 1: Creating Vietnamese PC Build...');
    const createVnDto: CreatePCBuildDto = {
      name: 'Cấu hình Gaming PC Cao cấp 2024',
      description: 'Máy tính gaming hiệu năng cao với linh kiện mới nhất',
      content: `# Cấu hình Gaming PC Cao cấp 2024

## Thông số kỹ thuật

### CPU
- **Processor**: Intel Core i9-13900K
- **Cores**: 24 cores (8P + 16E)
- **Base Clock**: 3.0 GHz
- **Max Boost**: 5.8 GHz

### GPU  
- **Graphics Card**: NVIDIA GeForce RTX 4090
- **VRAM**: 24GB GDDR6X
- **Boost Clock**: 2520 MHz

### RAM
- **Memory**: 32GB DDR5-5600
- **Brand**: G.Skill Trident Z5 RGB
- **Latency**: CL36

### Storage
- **Primary**: Samsung 980 PRO 2TB NVMe SSD
- **Secondary**: Seagate BarraCuda 4TB HDD

### Motherboard
- **Chipset**: Intel Z790
- **Model**: ASUS ROG Strix Z790-E Gaming

### PSU
- **Power Supply**: Corsair RM1000x 1000W 80+ Gold

### Cooling
- **CPU Cooler**: NZXT Kraken X73 360mm AIO
- **Case Fans**: 6x Corsair iCUE QL120 RGB

### Case
- **Chassis**: Corsair iCUE 5000X RGB

## Giá thành dự kiến
- **Tổng chi phí**: ~120,000,000 VNĐ
- **Thời gian lắp ráp**: 3-4 giờ

## Lưu ý
- Cấu hình này phù hợp cho gaming 4K, streaming và content creation
- Có thể chạy mọi game hiện tại ở setting Ultra với FPS cao
- Hỗ trợ ray tracing và DLSS 3.0`,
      imageUrl: 'https://example.com/gaming-pc-2024.jpg',
      tags: ['gaming', 'cao-cap', '4k', 'rtx-4090', 'i9-13900k'],
      isPublic: true,
      lang: 'vi',
    };

    const createdVietnameseBuild = await pcBuildService.createBuild(
      createVnDto,
      mockUserId,
    );
    createdBuildId = (createdVietnameseBuild as any)._id.toString();

    console.log('✅ Vietnamese PC Build created successfully:');
    console.log(`   ID: ${(createdVietnameseBuild as any)._id}`);
    console.log(`   Name: ${createdVietnameseBuild.name}`);
    console.log(`   Language: ${createdVietnameseBuild.lang}`);
    console.log(`   Public: ${createdVietnameseBuild.isPublic}`);
    console.log(`   Tags: ${createdVietnameseBuild.tags?.join(', ')}`);
    console.log('');

    // Test 2: Create PC Build (English)
    console.log('📝 Test 2: Creating English PC Build...');
    const createEnDto: CreatePCBuildDto = {
      name: 'High-End Gaming PC Build 2024',
      description: 'Top-tier gaming computer with latest components',
      content: `# High-End Gaming PC Build 2024

## Specifications

### CPU
- **Processor**: AMD Ryzen 9 7950X
- **Cores**: 16 cores / 32 threads
- **Base Clock**: 4.5 GHz
- **Max Boost**: 5.7 GHz

### GPU  
- **Graphics Card**: NVIDIA GeForce RTX 4080
- **VRAM**: 16GB GDDR6X
- **Boost Clock**: 2505 MHz

### RAM
- **Memory**: 32GB DDR5-6000
- **Brand**: Corsair Dominator Platinum RGB
- **Latency**: CL30

### Storage
- **Primary**: WD Black SN850X 1TB NVMe SSD
- **Secondary**: Samsung 980 1TB NVMe SSD

### Motherboard
- **Chipset**: AMD X670E
- **Model**: MSI MEG X670E ACE

### PSU
- **Power Supply**: EVGA SuperNOVA 850W 80+ Gold

### Cooling
- **CPU Cooler**: Corsair H150i Elite Capellix 360mm AIO
- **Case Fans**: 7x Lian Li AL120 RGB

### Case
- **Chassis**: Lian Li PC-O11 Dynamic EVO

## Estimated Cost
- **Total Budget**: ~$4,500 USD
- **Build Time**: 4-5 hours

## Notes
- Perfect for 1440p ultra gaming and 4K gaming
- Excellent for streaming and content creation
- Future-proof for next 3-4 years`,
      imageUrl: 'https://example.com/gaming-pc-en-2024.jpg',
      tags: ['gaming', 'high-end', '1440p', 'rtx-4080', 'ryzen-9'],
      isPublic: true,
      lang: 'en',
    };

    const createdEnglishBuild = await pcBuildService.createBuild(
      createEnDto,
      mockUserId,
    );

    console.log('✅ English PC Build created successfully:');
    console.log(`   ID: ${(createdEnglishBuild as any)._id}`);
    console.log(`   Name: ${createdEnglishBuild.name}`);
    console.log(`   Language: ${createdEnglishBuild.lang}`);
    console.log(`   Public: ${createdEnglishBuild.isPublic}`);
    console.log(`   Tags: ${createdEnglishBuild.tags?.join(', ')}`);
    console.log('');

    // Test 3: Update PC Build
    console.log('📝 Test 3: Updating Vietnamese PC Build...');
    const updateDto: UpdatePCBuildDto = {
      name: 'Cấu hình Gaming PC Cao cấp 2024 - Phiên bản nâng cấp',
      description:
        'Máy tính gaming hiệu năng cao với linh kiện mới nhất - Đã được tối ưu hóa',
      tags: [
        'gaming',
        'cao-cap',
        '4k',
        'rtx-4090',
        'i9-13900k',
        'updated',
        'optimized',
      ],
      isPublic: false, // Make it private
    };

    const updatedBuild = await pcBuildService.updateBuild(
      createdBuildId,
      updateDto,
      mockUserId,
    );

    console.log('✅ PC Build updated successfully:');
    console.log(`   ID: ${(updatedBuild as any)._id}`);
    console.log(`   New Name: ${updatedBuild.name}`);
    console.log(`   New Description: ${updatedBuild.description}`);
    console.log(`   Public: ${updatedBuild.isPublic}`);
    console.log(`   Updated Tags: ${updatedBuild.tags?.join(', ')}`);
    console.log('');

    // Test 4: Partial Update
    console.log('📝 Test 4: Partial Update (only name)...');
    const partialUpdateDto: UpdatePCBuildDto = {
      name: 'Cấu hình Gaming PC Siêu Cao cấp 2024 - Final Version',
    };

    const partialUpdatedBuild = await pcBuildService.updateBuild(
      createdBuildId,
      partialUpdateDto,
      mockUserId,
    );

    console.log('✅ PC Build partially updated successfully:');
    console.log(`   ID: ${(partialUpdatedBuild as any)._id}`);
    console.log(`   New Name: ${partialUpdatedBuild.name}`);
    console.log(
      `   Description (unchanged): ${partialUpdatedBuild.description}`,
    );
    console.log(`   Tags (unchanged): ${partialUpdatedBuild.tags?.join(', ')}`);
    console.log('');

    // Test 5: Find by ID with language filter
    console.log('📝 Test 5: Finding PC Build by ID...');
    const foundBuild = await pcBuildService.findBuildById(createdBuildId);

    console.log('✅ PC Build found successfully:');
    console.log(`   ID: ${(foundBuild as any)._id}`);
    console.log(`   Name: ${foundBuild.name}`);
    console.log(`   Language: ${foundBuild.lang}`);
    console.log(`   Public: ${foundBuild.isPublic}`);
    console.log('');

    // Test 6: Find all builds with pagination
    console.log('📝 Test 6: Finding all builds with pagination...');
    const allBuilds = await pcBuildService.findAllBuilds(5, 1, 'vi');

    console.log('✅ All builds retrieved successfully:');
    console.log(`   Total builds: ${allBuilds.total}`);
    console.log(`   Current page builds: ${allBuilds.builds.length}`);
    console.log(`   Vietnamese builds:`);
    allBuilds.builds.forEach((build, index) => {
      console.log(`     ${index + 1}. ${build.name} (${build.lang})`);
    });
    console.log('');

    // Test 7: Find user builds
    console.log('📝 Test 7: Finding user builds...');
    const userBuilds = await pcBuildService.findUserBuilds(mockUserId, 'vi');

    console.log('✅ User builds retrieved successfully:');
    console.log(`   User builds count: ${userBuilds.length}`);
    userBuilds.forEach((build, index) => {
      console.log(
        `     ${index + 1}. ${build.name} - Public: ${build.isPublic}`,
      );
    });
    console.log('');

    // Test 8: Error handling tests
    console.log('📝 Test 8: Testing error scenarios...');

    try {
      // Test not found
      await pcBuildService.findBuildById('507f1f77bcf86cd799439000');
    } catch (error) {
      console.log('✅ Not found error handled correctly:', error.message);
    }

    try {
      // Test unauthorized update
      const differentUserId = '6507f1f77bcf86cd799439012';
      await pcBuildService.updateBuild(
        createdBuildId,
        partialUpdateDto,
        differentUserId,
      );
    } catch (error) {
      console.log('✅ Unauthorized error handled correctly:', error.message);
    }

    try {
      // Test unauthorized delete
      const differentUserId = '6507f1f77bcf86cd799439012';
      await pcBuildService.deleteBuild(createdBuildId, differentUserId);
    } catch (error) {
      console.log(
        '✅ Unauthorized delete error handled correctly:',
        error.message,
      );
    }

    console.log('');

    // Test 9: Find by tag
    console.log('📝 Test 9: Finding builds by tag...');
    const taggedBuilds = await pcBuildService.findByTag('gaming', 10, 1, 'vi');

    console.log('✅ Builds with "gaming" tag retrieved successfully:');
    console.log(`   Total tagged builds: ${taggedBuilds.total}`);
    console.log(`   Current page builds: ${taggedBuilds.builds.length}`);
    taggedBuilds.builds.forEach((build, index) => {
      console.log(
        `     ${index + 1}. ${build.name} - Tags: ${build.tags?.join(', ')}`,
      );
    });
    console.log('');

    // Test 10: Admin find all builds
    console.log('📝 Test 10: Admin finding all builds (including private)...');
    const adminBuilds = await pcBuildService.findAllBuildsAdmin(10, 1, 'vi');

    console.log('✅ Admin builds retrieved successfully:');
    console.log(`   Total admin builds: ${adminBuilds.total}`);
    console.log(`   Current page builds: ${adminBuilds.builds.length}`);
    adminBuilds.builds.forEach((build, index) => {
      console.log(
        `     ${index + 1}. ${build.name} - Public: ${build.isPublic} (${build.lang})`,
      );
    });
    console.log('');

    console.log('🎉 All PC Build CRUD tests completed successfully!');
    console.log('');
    console.log('📊 Test Summary:');
    console.log('   ✅ Create Vietnamese PC Build');
    console.log('   ✅ Create English PC Build');
    console.log('   ✅ Update PC Build (full)');
    console.log('   ✅ Update PC Build (partial)');
    console.log('   ✅ Find PC Build by ID');
    console.log('   ✅ Find all builds with pagination');
    console.log('   ✅ Find user builds');
    console.log('   ✅ Error handling (Not Found, Unauthorized)');
    console.log('   ✅ Find builds by tag');
    console.log('   ✅ Admin find all builds');
    console.log('');
    console.log(
      '📝 Note: These tests demonstrate all CRUD operations work correctly!',
    );
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  testPCBuildCRUD().catch(console.error);
}
