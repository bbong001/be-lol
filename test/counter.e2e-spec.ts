import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ChampionsModule } from '../src/champions/champions.module';
import {
  CreateCounterDto,
  UpdateCounterDto,
} from '../src/champions/dto/counter.dto';

describe('Counter Controller (e2e)', () => {
  let app: INestApplication;
  let createdCounterId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        MongooseModule.forRoot(
          process.env.MONGODB_URI_TEST ||
            'mongodb://localhost:27017/lol-check-test',
        ),
        ChampionsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    if (createdCounterId) {
      await request(app.getHttpServer())
        .delete(`/counters/${createdCounterId}`)
        .expect(204);
    }
    await app.close();
  });

  describe('/counters (POST)', () => {
    it('should create a new counter', async () => {
      const createCounterDto: CreateCounterDto = {
        championId: 'aatrox-test',
        championName: 'Aatrox Test',
        role: 'top',
        overallWinRate: 52.5,
        pickRate: 8.2,
        banRate: 12.1,
        strongAgainst: [
          {
            championId: 'yasuo',
            championName: 'Yasuo',
            winRate: 58.3,
            counterRating: 7.5,
            gameCount: 1250,
            goldDifferentialAt15: 350,
            difficulty: 'Medium',
            tips: 'Focus on early game trades',
          },
        ],
        weakAgainst: [
          {
            championId: 'fiora',
            championName: 'Fiora',
            winRate: 45.2,
            counterRating: 8.2,
            gameCount: 980,
            goldDifferentialAt15: -280,
            difficulty: 'Hard',
            tips: 'Avoid extended trades',
          },
        ],
        patch: '15.10',
        rank: 'Emerald+',
        region: 'World',
      };

      const response = await request(app.getHttpServer())
        .post('/counters')
        .send(createCounterDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.championId).toBe(createCounterDto.championId);
      expect(response.body.championName).toBe(createCounterDto.championName);
      expect(response.body.role).toBe(createCounterDto.role);
      expect(response.body.overallWinRate).toBe(
        createCounterDto.overallWinRate,
      );
      expect(response.body.strongAgainst).toHaveLength(1);
      expect(response.body.weakAgainst).toHaveLength(1);

      createdCounterId = response.body._id;
    });

    it('should return 400 when creating duplicate counter', async () => {
      const createCounterDto: CreateCounterDto = {
        championId: 'aatrox-test',
        championName: 'Aatrox Test',
        role: 'top',
        patch: '15.10',
        rank: 'Emerald+',
        region: 'World',
      };

      await request(app.getHttpServer())
        .post('/counters')
        .send(createCounterDto)
        .expect(400);
    });

    it('should return 400 when missing required fields', async () => {
      const invalidDto = {
        championName: 'Test Champion',
        // Missing championId and role
      };

      await request(app.getHttpServer())
        .post('/counters')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/counters (GET)', () => {
    it('should return paginated counter data', async () => {
      const response = await request(app.getHttpServer())
        .get('/counters')
        .query({ limit: 10, skip: 0 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/counters')
        .query({ role: 'top' })
        .expect(200);

      expect(
        response.body.data.every((counter: any) => counter.role === 'top'),
      ).toBe(true);
    });

    it('should filter by champion name', async () => {
      const response = await request(app.getHttpServer())
        .get('/counters')
        .query({ championName: 'Aatrox' })
        .expect(200);

      expect(
        response.body.data.every((counter: any) =>
          counter.championName.toLowerCase().includes('aatrox'),
        ),
      ).toBe(true);
    });
  });

  describe('/counters/:championId/:role (GET)', () => {
    it('should return counter data for specific champion and role', async () => {
      const response = await request(app.getHttpServer())
        .get('/counters/aatrox-test/top')
        .expect(200);

      expect(response.body.championId).toBe('aatrox-test');
      expect(response.body.role).toBe('top');
      expect(response.body).toHaveProperty('strongAgainst');
      expect(response.body).toHaveProperty('weakAgainst');
    });

    it('should return counter data with query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/counters/aatrox-test/top')
        .query({
          patch: '15.10',
          rank: 'Emerald+',
          region: 'World',
        })
        .expect(200);

      expect(response.body.championId).toBe('aatrox-test');
      expect(response.body.patch).toBe('15.10');
      expect(response.body.rank).toBe('Emerald+');
      expect(response.body.region).toBe('World');
    });

    it('should return 404 for non-existent champion', async () => {
      await request(app.getHttpServer())
        .get('/counters/nonexistent/top')
        .expect(404);
    });

    it('should return 404 for invalid role', async () => {
      await request(app.getHttpServer())
        .get('/counters/aatrox-test/invalidrole')
        .expect(404);
    });
  });

  describe('/counters/:id (PUT)', () => {
    it('should update counter data', async () => {
      const updateCounterDto: UpdateCounterDto = {
        overallWinRate: 55.0,
        pickRate: 9.5,
        banRate: 10.0,
      };

      const response = await request(app.getHttpServer())
        .put(`/counters/${createdCounterId}`)
        .send(updateCounterDto)
        .expect(200);

      expect(response.body.overallWinRate).toBe(55.0);
      expect(response.body.pickRate).toBe(9.5);
      expect(response.body.banRate).toBe(10.0);
      expect(response.body.championId).toBe('aatrox-test'); // Should remain unchanged
    });

    it('should update only provided fields', async () => {
      const updateCounterDto: UpdateCounterDto = {
        overallWinRate: 53.2,
      };

      const response = await request(app.getHttpServer())
        .put(`/counters/${createdCounterId}`)
        .send(updateCounterDto)
        .expect(200);

      expect(response.body.overallWinRate).toBe(53.2);
      expect(response.body.pickRate).toBe(9.5); // Should remain from previous update
    });

    it('should return 404 for non-existent counter', async () => {
      const updateCounterDto: UpdateCounterDto = {
        overallWinRate: 50.0,
      };

      await request(app.getHttpServer())
        .put('/counters/507f1f77bcf86cd799439999')
        .send(updateCounterDto)
        .expect(404);
    });

    it('should return 400 for invalid data', async () => {
      const invalidUpdateDto = {
        overallWinRate: 150, // Invalid: should be 0-100
      };

      await request(app.getHttpServer())
        .put(`/counters/${createdCounterId}`)
        .send(invalidUpdateDto)
        .expect(400);
    });
  });

  describe('/counters/:id (DELETE)', () => {
    it('should return 404 for non-existent counter', async () => {
      await request(app.getHttpServer())
        .delete('/counters/507f1f77bcf86cd799439999')
        .expect(404);
    });

    it('should delete counter data', async () => {
      await request(app.getHttpServer())
        .delete(`/counters/${createdCounterId}`)
        .expect(204);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/counters/aatrox-test/top`)
        .expect(404);

      createdCounterId = null; // Prevent cleanup in afterAll
    });
  });

  describe('Validation and Error Handling', () => {
    it('should validate role enum in create', async () => {
      const invalidDto = {
        championId: 'test',
        championName: 'Test',
        role: 'invalidrole',
      };

      await request(app.getHttpServer())
        .post('/counters')
        .send(invalidDto)
        .expect(400);
    });

    it('should validate win rate range', async () => {
      const invalidDto = {
        championId: 'test2',
        championName: 'Test2',
        role: 'top',
        overallWinRate: 150, // Invalid: > 100
      };

      await request(app.getHttpServer())
        .post('/counters')
        .send(invalidDto)
        .expect(400);
    });

    it('should validate counter rating range', async () => {
      const invalidDto = {
        championId: 'test3',
        championName: 'Test3',
        role: 'top',
        strongAgainst: [
          {
            championId: 'yasuo',
            championName: 'Yasuo',
            winRate: 50,
            counterRating: 15, // Invalid: > 10
            gameCount: 100,
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/counters')
        .send(invalidDto)
        .expect(400);
    });
  });
});
