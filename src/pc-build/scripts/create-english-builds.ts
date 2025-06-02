import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PcBuildService } from '../pc-build.service';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';

async function createEnglishPCBuilds() {
  console.log('🔧 Creating English PC builds...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const pcBuildService = app.get(PcBuildService);
  const userModel: Model<UserDocument> = app.get(getModelToken(User.name));

  try {
    // Find admin user or use test ID
    let testUserId = 'test-admin-id';

    const adminUsers = await userModel.find({ role: 'admin' }).limit(1).exec();
    if (adminUsers.length > 0) {
      testUserId = adminUsers[0]._id.toString();
      console.log(`✅ Using admin user: ${adminUsers[0].name}`);
    } else {
      console.log(`⚠️ No admin user found, using test ID`);
    }

    // Build 1: Gaming PC
    const build1 = {
      name: 'Ultimate Gaming PC Build 2024',
      description: 'High-performance gaming setup for 4K gaming and streaming',
      content: `
# Ultimate Gaming PC Build 2024

## Overview
This build is designed for enthusiast gamers who want the best performance for 4K gaming, streaming, and content creation. Every component has been carefully selected for maximum performance and reliability.

## Components List

### CPU: AMD Ryzen 7 7800X3D
- 8 cores / 16 threads
- 4.2 GHz base, 5.0 GHz boost
- 3D V-Cache technology for gaming
- Best gaming CPU on the market

### GPU: NVIDIA GeForce RTX 4080 Super
- 16GB GDDR6X VRAM
- Ray tracing capabilities
- DLSS 3 support
- Perfect for 4K gaming

### Motherboard: ASUS ROG Strix B650E-F
- AM5 socket
- PCIe 5.0 support
- WiFi 6E built-in
- Premium VRM design

### Memory: G.Skill Trident Z5 32GB DDR5-6000
- 32GB (2x16GB) kit
- DDR5-6000 speed
- CL30 timings
- RGB lighting

### Storage: Samsung 980 PRO 2TB
- NVMe PCIe 4.0 SSD
- 7,000 MB/s read speed
- 2TB capacity
- 5-year warranty

### PSU: Corsair RM850x 850W 80+ Gold
- 850W capacity
- 80+ Gold efficiency
- Fully modular cables
- 10-year warranty

### Case: Fractal Design Define 7
- Mid-tower case
- Excellent airflow
- Sound dampening
- Premium build quality

### Cooling: Noctua NH-D15
- Dual tower cooler
- Exceptional performance
- Low noise operation
- 6-year warranty

## Performance Expectations

### Gaming Performance
- **4K Gaming**: 60-120+ FPS in most titles
- **1440p Gaming**: 144+ FPS ultra settings
- **1080p Gaming**: 240+ FPS competitive settings

### Content Creation
- **Video Editing**: Smooth 4K timeline editing
- **Streaming**: No performance impact while gaming
- **3D Rendering**: Professional-grade performance

## Estimated Budget: $2,800 - $3,200

## Why This Build?
This configuration represents the sweet spot for high-end gaming. The Ryzen 7 7800X3D provides unmatched gaming performance, while the RTX 4080 Super handles any game at 4K with ray tracing enabled.
      `,
      tags: ['gaming', 'high-end', 'rtx4080', 'ryzen', '4k-gaming'],
      isPublic: true,
      lang: 'en',
    };

    // Build 2: Budget PC
    const build2 = {
      name: 'Budget Gaming PC Build 2024',
      description:
        'Affordable gaming setup for 1080p gaming and everyday tasks',
      content: `
# Budget Gaming PC Build 2024

## Overview
This budget-friendly build proves you don't need to spend a fortune to enjoy modern gaming. Perfect for 1080p gaming at high settings and general productivity tasks.

## Components List

### CPU: AMD Ryzen 5 5600
- 6 cores / 12 threads
- 3.5 GHz base, 4.4 GHz boost
- Excellent price-to-performance
- AM4 platform

### GPU: NVIDIA GeForce RTX 4060
- 8GB GDDR6 VRAM
- Ray tracing support
- DLSS 3 technology
- Perfect for 1080p gaming

### Motherboard: MSI B450M PRO-VDH MAX
- AM4 socket
- Ryzen 5000 ready
- Micro-ATX form factor
- Great value

### Memory: Corsair Vengeance LPX 16GB DDR4-3200
- 16GB (2x8GB) kit
- DDR4-3200 speed
- CL16 timings
- Reliable and affordable

### Storage: Kingston NV2 1TB NVMe SSD
- 1TB NVMe SSD
- PCIe 4.0 interface
- 3,500 MB/s read speed
- Great value storage

### PSU: EVGA BR 600W 80+ Bronze
- 600W capacity
- 80+ Bronze efficiency
- 3-year warranty
- Reliable power delivery

### Case: Cooler Master MasterBox Q300L
- Micro-ATX case
- Compact design
- Good airflow
- Budget-friendly

### Cooling: Stock AMD Cooler
- Included with CPU
- Adequate performance
- Zero additional cost

## Performance Expectations

### Gaming Performance
- **1080p Gaming**: 60-144 FPS high settings
- **Esports Titles**: 144+ FPS competitive settings
- **Ray Tracing**: 30-60 FPS with DLSS

### General Use
- **Web Browsing**: Smooth multitasking
- **Office Work**: Excel, Word, PowerPoint
- **Video Streaming**: 4K video playback

## Estimated Budget: $800 - $1,000

## Upgrade Path
Start with this build and upgrade components over time:
1. Add more RAM (32GB total)
2. Upgrade GPU when prices drop
3. Add more storage as needed
4. Upgrade to better CPU cooler for overclocking
      `,
      tags: ['budget', 'gaming', 'rtx4060', 'ryzen5', '1080p'],
      isPublic: true,
      lang: 'en',
    };

    const builds = [build1, build2];
    let successCount = 0;
    let errorCount = 0;

    console.log('🚀 Creating PC builds...\n');

    for (let i = 0; i < builds.length; i++) {
      const buildData = builds[i];
      try {
        console.log(`🔧 Creating build ${i + 1}: "${buildData.name}"`);

        const createdBuild = await pcBuildService.createBuild(
          buildData,
          testUserId,
        );

        console.log(`✅ Success! Created PC build:`);
        console.log(`   ID: ${(createdBuild as any)._id}`);
        console.log(`   Name: ${createdBuild.name}`);
        console.log(`   Language: ${createdBuild.lang}`);
        console.log(`   Public: ${createdBuild.isPublic}\n`);

        successCount++;
      } catch (error) {
        console.log(`❌ Error creating build ${i + 1}: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('📊 CREATION SUMMARY:');
    console.log(`✅ Successfully created: ${successCount} PC builds`);
    console.log(`❌ Errors: ${errorCount} PC builds`);

    // Test the created builds
    if (successCount > 0) {
      console.log('\n🧪 Testing created English PC builds...');

      const enBuilds = await pcBuildService.findAllBuilds(10, 1, 'en');
      console.log(`\n🔧 Found ${enBuilds.builds.length} English PC builds:`);

      enBuilds.builds.forEach((build, index) => {
        console.log(`${index + 1}. "${build.name}"`);
      });

      // Test tag search
      if (enBuilds.builds.length > 0) {
        console.log('\n🏷️ Testing tag search for "gaming":');
        const taggedBuilds = await pcBuildService.findByTag(
          'gaming',
          10,
          1,
          'en',
        );
        console.log(
          `Found ${taggedBuilds.builds.length} builds with tag "gaming"`,
        );
      }
    }

    console.log('\n🌐 You can now test these API endpoints:');
    console.log(
      'GET /pc-build/builds?lang=en                  - Get all English builds',
    );
    console.log(
      'GET /pc-build/tag/gaming?lang=en              - Search for "gaming" tag',
    );
    console.log(
      'GET /pc-build/admin?lang=en                   - Admin view of English builds',
    );
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await app.close();
    console.log('\n🏁 PC build creation completed');
  }
}

// Run script
createEnglishPCBuilds()
  .then(() => {
    console.log('\n✨ English PC builds creation finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 English PC builds creation failed:', error);
    process.exit(1);
  });
