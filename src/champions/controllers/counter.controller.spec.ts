import { Test, TestingModule } from '@nestjs/testing';
import { CounterController } from './counter.controller';
import { CounterService } from '../services/counter.service';
import {
  CreateCounterDto,
  UpdateCounterDto,
  CounterQueryDto,
} from '../dto/counter.dto';
import { Counter } from '../schemas/counter.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CounterController', () => {
  let controller: CounterController;
  let service: CounterService;

  const mockCounterService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByChampionAndRole: jest.fn(),
    findByChampionName: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockCounter: Counter = {
    _id: '507f1f77bcf86cd799439011',
    championId: 'aatrox',
    championName: 'Aatrox',
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
    createdAt: new Date('2024-01-01'),
    lastUpdated: new Date('2024-01-15'),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CounterController],
      providers: [
        {
          provide: CounterService,
          useValue: mockCounterService,
        },
      ],
    }).compile();

    controller = module.get<CounterController>(CounterController);
    service = module.get<CounterService>(CounterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new counter successfully', async () => {
      const createCounterDto: CreateCounterDto = {
        championId: 'aatrox',
        championName: 'Aatrox',
        role: 'top',
        overallWinRate: 52.5,
        pickRate: 8.2,
        banRate: 12.1,
        patch: '15.10',
        rank: 'Emerald+',
        region: 'World',
      };

      mockCounterService.create.mockResolvedValue(mockCounter);

      const result = await controller.create(createCounterDto);

      expect(service.create).toHaveBeenCalledWith(createCounterDto);
      expect(result).toEqual(mockCounter);
    });

    it('should throw BadRequestException when counter already exists', async () => {
      const createCounterDto: CreateCounterDto = {
        championId: 'aatrox',
        championName: 'Aatrox',
        role: 'top',
      };

      mockCounterService.create.mockRejectedValue(
        new BadRequestException(
          'Counter data already exists for Aatrox in top role',
        ),
      );

      await expect(controller.create(createCounterDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.create).toHaveBeenCalledWith(createCounterDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated counter data', async () => {
      const query: CounterQueryDto = {
        limit: 10,
        skip: 0,
        role: 'top',
      };

      const mockResponse = {
        data: [mockCounter],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockCounterService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });

    it('should return empty array when no counters found', async () => {
      const query: CounterQueryDto = {
        championName: 'NonExistentChampion',
      };

      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockCounterService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findByChampionAndRole', () => {
    it('should return counter data for specific champion and role', async () => {
      const championId = 'aatrox';
      const role = 'top';
      const patch = '15.10';
      const rank = 'Emerald+';
      const region = 'World';

      mockCounterService.findByChampionAndRole.mockResolvedValue(mockCounter);

      const result = await controller.findByChampionAndRole(
        championId,
        role,
        patch,
        rank,
        region,
      );

      expect(service.findByChampionAndRole).toHaveBeenCalledWith(
        championId,
        role,
        patch,
        rank,
        region,
      );
      expect(result).toEqual(mockCounter);
    });

    it('should throw NotFoundException when counter not found', async () => {
      const championId = 'nonexistent';
      const role = 'top';

      mockCounterService.findByChampionAndRole.mockRejectedValue(
        new NotFoundException(
          'Counter data not found for champion nonexistent in top role',
        ),
      );

      await expect(
        controller.findByChampionAndRole(championId, role),
      ).rejects.toThrow(NotFoundException);
      expect(service.findByChampionAndRole).toHaveBeenCalledWith(
        championId,
        role,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('findByChampionName', () => {
    it('should return counter data for specific champion name', async () => {
      const championName = 'Aatrox';
      const role = 'top';
      const patch = '15.10';
      const rank = 'Emerald+';
      const region = 'World';

      mockCounterService.findByChampionName.mockResolvedValue([mockCounter]);

      const result = await controller.findByChampionName(
        championName,
        role,
        patch,
        rank,
        region,
      );

      expect(service.findByChampionName).toHaveBeenCalledWith(
        championName,
        role,
        patch,
        rank,
        region,
      );
      expect(result).toEqual([mockCounter]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return counter data for champion name without role filter', async () => {
      const championName = 'Aatrox';

      mockCounterService.findByChampionName.mockResolvedValue([mockCounter]);

      const result = await controller.findByChampionName(championName);

      expect(service.findByChampionName).toHaveBeenCalledWith(
        championName,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual([mockCounter]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no champion found by name', async () => {
      const championName = 'NonExistentChampion';

      mockCounterService.findByChampionName.mockResolvedValue([]);

      const result = await controller.findByChampionName(championName);

      expect(service.findByChampionName).toHaveBeenCalledWith(
        championName,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle case insensitive search', async () => {
      const championName = 'aatrox';

      mockCounterService.findByChampionName.mockResolvedValue([mockCounter]);

      const result = await controller.findByChampionName(championName);

      expect(service.findByChampionName).toHaveBeenCalledWith(
        championName,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual([mockCounter]);
    });

    it('should handle partial name search', async () => {
      const championName = 'Aat';

      mockCounterService.findByChampionName.mockResolvedValue([mockCounter]);

      const result = await controller.findByChampionName(championName);

      expect(service.findByChampionName).toHaveBeenCalledWith(
        championName,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual([mockCounter]);
    });

    it('should filter by role when role parameter is provided', async () => {
      const championName = 'Yasuo';
      const role = 'mid';

      mockCounterService.findByChampionName.mockResolvedValue([mockCounter]);

      const result = await controller.findByChampionName(championName, role);

      expect(service.findByChampionName).toHaveBeenCalledWith(
        championName,
        role,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual([mockCounter]);
    });
  });

  describe('update', () => {
    it('should update counter data successfully', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateCounterDto: UpdateCounterDto = {
        overallWinRate: 55.0,
        pickRate: 9.5,
      };

      const updatedCounter = { ...mockCounter, ...updateCounterDto };
      mockCounterService.update.mockResolvedValue(updatedCounter);

      const result = await controller.update(id, updateCounterDto);

      expect(service.update).toHaveBeenCalledWith(id, updateCounterDto);
      expect(result).toEqual(updatedCounter);
    });

    it('should throw NotFoundException when counter to update not found', async () => {
      const id = 'nonexistent';
      const updateCounterDto: UpdateCounterDto = {
        overallWinRate: 55.0,
      };

      mockCounterService.update.mockRejectedValue(
        new NotFoundException('Counter data not found'),
      );

      await expect(controller.update(id, updateCounterDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.update).toHaveBeenCalledWith(id, updateCounterDto);
    });
  });

  describe('remove', () => {
    it('should delete counter data successfully', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockCounterService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when counter to delete not found', async () => {
      const id = 'nonexistent';

      mockCounterService.remove.mockRejectedValue(
        new NotFoundException('Counter data not found'),
      );

      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle empty query parameters in findAll', async () => {
      const query: CounterQueryDto = {};

      const mockResponse = {
        data: [mockCounter],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockCounterService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });

    it('should handle optional parameters in findByChampionAndRole', async () => {
      const championId = 'aatrox';
      const role = 'top';

      mockCounterService.findByChampionAndRole.mockResolvedValue(mockCounter);

      const result = await controller.findByChampionAndRole(championId, role);

      expect(service.findByChampionAndRole).toHaveBeenCalledWith(
        championId,
        role,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockCounter);
    });

    it('should handle partial updates', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateCounterDto: UpdateCounterDto = {
        overallWinRate: 53.2,
      };

      const updatedCounter = { ...mockCounter, overallWinRate: 53.2 };
      mockCounterService.update.mockResolvedValue(updatedCounter);

      const result = await controller.update(id, updateCounterDto);

      expect(service.update).toHaveBeenCalledWith(id, updateCounterDto);
      expect(result.overallWinRate).toBe(53.2);
    });
  });
});
