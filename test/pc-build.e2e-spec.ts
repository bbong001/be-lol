import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { PcBuildModule } from '../src/pc-build/pc-build.module';
import { AuthModule } from '../src/auth/auth.module';
import { UserModule } from '../src/user/user.module';
import { CreatePCBuildDto } from '../src/pc-build/dtos/create-pc-build.dto';
import { UpdatePCBuildDto } from '../src/pc-build/dtos/update-pc-build.dto';

describe('PCBuild E2E Tests', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let authToken: string;
  let adminToken: string;
  let normalUserId: string;
  let adminUserId: string;
  let createdBuildId: string;

  const mockUser = {
    email: 'testuser@example.com',
    password: 'testPassword123',
    name: 'Test User',
  };

  const mockAdmin = {
    email: 'admin@example.com',
    password: 'adminPassword123',
    name: 'Admin User',
  };

  const createBuildDto: CreatePCBuildDto = {
    name: 'Test Gaming PC Build',
    description: 'High-end gaming setup for testing',
    content:
      '# Test Gaming PC Build\n\n## Components\n- CPU: Intel i9-13900K\n- GPU: RTX 4090\n- RAM: 32GB DDR5',
    imageUrl: 'https://example.com/test-pc-image.jpg',
    tags: ['gaming', 'high-end', 'test'],
    isPublic: true,
    lang: 'vi',
  };

  const updateBuildDto: UpdatePCBuildDto = {
    name: 'Updated Gaming PC Build',
    description: 'Updated high-end gaming setup',
    tags: ['gaming', 'updated', 'premium'],
    isPublic: false,
  };

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        MongooseModule.forRoot(uri),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '24h' },
        }),
        AuthModule,
        UserModule,
        PcBuildModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Create test users
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(mockUser)
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(mockAdmin)
      .expect(201);

    // Login to get tokens
    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      })
      .expect(200);

    authToken = userLoginResponse.body.access_token;
    normalUserId = userLoginResponse.body.user.id;

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: mockAdmin.email,
        password: mockAdmin.password,
      })
      .expect(200);

    adminToken = adminLoginResponse.body.access_token;
    adminUserId = adminLoginResponse.body.user.id;

    // Set admin role for admin user (this might need to be done through database or admin endpoint)
    await mongoose.connection
      .collection('users')
      .updateOne({ email: mockAdmin.email }, { $set: { role: 'admin' } });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
    await app.close();
  });

  describe('POST /pc-build/builds', () => {
    it('should create a new PC build successfully with admin token', async () => {
      const response = await request(app.getHttpServer())
        .post('/pc-build/builds')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createBuildDto)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name', createBuildDto.name);
      expect(response.body.data).toHaveProperty(
        'description',
        createBuildDto.description,
      );
      expect(response.body.data).toHaveProperty(
        'content',
        createBuildDto.content,
      );
      expect(response.body.data).toHaveProperty('tags');
      expect(response.body.data.tags).toEqual(createBuildDto.tags);
      expect(response.body.data).toHaveProperty('isPublic', true);
      expect(response.body.data).toHaveProperty('lang', 'vi');
      expect(response.body.data).toHaveProperty('user');

      createdBuildId = response.body.data._id;
    });

    it('should fail to create PC build without admin role', async () => {
      await request(app.getHttpServer())
        .post('/pc-build/builds')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createBuildDto)
        .expect(403);
    });

    it('should fail to create PC build without authentication', async () => {
      await request(app.getHttpServer())
        .post('/pc-build/builds')
        .send(createBuildDto)
        .expect(401);
    });

    it('should fail with invalid data - missing required fields', async () => {
      const invalidDto = {
        description: 'Missing name and content',
      };

      await request(app.getHttpServer())
        .post('/pc-build/builds')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should fail with invalid data - invalid language', async () => {
      const invalidDto = {
        ...createBuildDto,
        lang: 'invalid-lang',
      };

      await request(app.getHttpServer())
        .post('/pc-build/builds')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should create build with default language when not specified', async () => {
      const dtoWithoutLang = { ...createBuildDto, name: 'Build without lang' };
      delete dtoWithoutLang.lang;

      const response = await request(app.getHttpServer())
        .post('/pc-build/builds')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dtoWithoutLang)
        .expect(201);

      expect(response.body.data).toHaveProperty('lang', 'vi');
    });

    it('should create build with English language', async () => {
      const englishBuildDto = {
        ...createBuildDto,
        name: 'English Gaming PC Build',
        lang: 'en',
      };

      const response = await request(app.getHttpServer())
        .post('/pc-build/builds')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(englishBuildDto)
        .expect(201);

      expect(response.body.data).toHaveProperty('lang', 'en');
      expect(response.body.data).toHaveProperty(
        'name',
        'English Gaming PC Build',
      );
    });
  });

  describe('PUT /pc-build/builds/:id', () => {
    it('should update PC build successfully by the owner', async () => {
      const response = await request(app.getHttpServer())
        .put(`/pc-build/builds/${createdBuildId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateBuildDto)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('name', updateBuildDto.name);
      expect(response.body.data).toHaveProperty(
        'description',
        updateBuildDto.description,
      );
      expect(response.body.data.tags).toEqual(updateBuildDto.tags);
      expect(response.body.data).toHaveProperty('isPublic', false);
    });

    it('should fail to update non-existent build', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .put(`/pc-build/builds/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateBuildDto)
        .expect(404);
    });

    it('should fail to update with invalid ObjectId', async () => {
      const invalidId = 'invalid-id';

      await request(app.getHttpServer())
        .put(`/pc-build/builds/${invalidId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateBuildDto)
        .expect(400);
    });

    it('should fail to update build by different user', async () => {
      await request(app.getHttpServer())
        .put(`/pc-build/builds/${createdBuildId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateBuildDto)
        .expect(403);
    });

    it('should fail to update build without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/pc-build/builds/${createdBuildId}`)
        .send(updateBuildDto)
        .expect(401);
    });

    it('should handle partial updates correctly', async () => {
      const partialUpdate = {
        name: 'Partially Updated Build',
      };

      const response = await request(app.getHttpServer())
        .put(`/pc-build/builds/${createdBuildId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.data).toHaveProperty(
        'name',
        'Partially Updated Build',
      );
      // Other fields should remain unchanged
      expect(response.body.data).toHaveProperty(
        'content',
        createBuildDto.content,
      );
    });

    it('should validate updated data correctly', async () => {
      const invalidUpdate = {
        lang: 'invalid-language',
      };

      await request(app.getHttpServer())
        .put(`/pc-build/builds/${createdBuildId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUpdate)
        .expect(400);
    });
  });

  describe('GET /pc-build/builds/:id', () => {
    it('should get PC build by ID successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/pc-build/builds/${createdBuildId}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('_id', createdBuildId);
      expect(response.body.data).toHaveProperty('name');
    });

    it('should get PC build with language filter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/pc-build/builds/${createdBuildId}`)
        .query({ lang: 'vi' })
        .expect(200);

      expect(response.body.data).toHaveProperty('lang', 'vi');
    });

    it('should return 404 for non-existent build', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .get(`/pc-build/builds/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('GET /pc-build/builds', () => {
    it('should get all public builds successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/pc-build/builds')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('builds');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.builds)).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/pc-build/builds')
        .query({ limit: 5, page: 1 })
        .expect(200);

      expect(response.body.data.builds.length).toBeLessThanOrEqual(5);
    });

    it('should filter by language correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/pc-build/builds')
        .query({ lang: 'vi' })
        .expect(200);

      response.body.data.builds.forEach((build) => {
        expect(build).toHaveProperty('lang', 'vi');
      });
    });
  });

  describe('DELETE /pc-build/builds/:id', () => {
    let buildToDeleteId: string;

    beforeAll(async () => {
      // Create a build to delete
      const response = await request(app.getHttpServer())
        .post('/pc-build/builds')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...createBuildDto,
          name: 'Build to Delete',
        })
        .expect(201);

      buildToDeleteId = response.body.data._id;
    });

    it('should delete PC build successfully by owner', async () => {
      await request(app.getHttpServer())
        .delete(`/pc-build/builds/${buildToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify build is deleted
      await request(app.getHttpServer())
        .get(`/pc-build/builds/${buildToDeleteId}`)
        .expect(404);
    });

    it('should fail to delete build by different user', async () => {
      await request(app.getHttpServer())
        .delete(`/pc-build/builds/${createdBuildId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should fail to delete non-existent build', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .delete(`/pc-build/builds/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /pc-build/user/builds', () => {
    it('should get user builds successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/pc-build/user/builds')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/pc-build/user/builds')
        .expect(401);
    });

    it('should filter user builds by language', async () => {
      const response = await request(app.getHttpServer())
        .get('/pc-build/user/builds')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ lang: 'vi' })
        .expect(200);

      response.body.data.forEach((build) => {
        expect(build).toHaveProperty('lang', 'vi');
      });
    });
  });
});
