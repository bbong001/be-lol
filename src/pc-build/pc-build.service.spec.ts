import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PcBuildService } from './pc-build.service';
import { PCBuild } from './schemas/pc-build.schema';
import { PCComponent } from './schemas/pc-component.schema';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePCBuildDto } from './dtos/create-pc-build.dto';
import { UpdatePCBuildDto } from './dtos/update-pc-build.dto';

describe('PcBuildService', () => {
  let service: PcBuildService;
  let pcBuildModel: any;
  let pcComponentModel: any;

  const mockUserId = '6507f1f77bcf86cd799439014';
  const mockBuildId = '6507f1f77bcf86cd799439015';

  const mockPCBuild = {
    _id: mockBuildId,
    name: 'Gaming PC Build',
    description: 'High-end gaming setup',
    content: '# Gaming PC Build\nDetailed specifications...',
    imageUrl: 'https://example.com/image.jpg',
    tags: ['gaming', 'high-end'],
    isPublic: true,
    user: mockUserId,
    lang: 'vi',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateDto: CreatePCBuildDto = {
    name: 'Test Gaming PC',
    description: 'Test gaming build',
    content: '# Test Gaming PC\nTest content...',
    imageUrl: 'https://example.com/test-image.jpg',
    tags: ['test', 'gaming'],
    isPublic: true,
    lang: 'vi',
  };

  const mockUpdateDto: UpdatePCBuildDto = {
    name: 'Updated Gaming PC',
    description: 'Updated description',
    tags: ['updated', 'gaming'],
  };

  beforeEach(async () => {
    // Mock for the model constructor
    const mockPCBuildConstructor = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: mockBuildId, ...data }),
    }));

    const mockPCBuildModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      save: jest.fn(),
      populate: jest.fn(),
      lean: jest.fn(),
      sort: jest.fn(),
      skip: jest.fn(),
      limit: jest.fn(),
    };

    // Assign the constructor function to the mock
    Object.assign(mockPCBuildModel, mockPCBuildConstructor);
    mockPCBuildModel.constructor = mockPCBuildConstructor;

    const mockPCComponentModel = {
      find: jest.fn(),
      findById: jest.fn(),
      lean: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PcBuildService,
        {
          provide: getModelToken(PCBuild.name),
          useValue: mockPCBuildModel,
        },
        {
          provide: getModelToken(PCComponent.name),
          useValue: mockPCComponentModel,
        },
      ],
    }).compile();

    service = module.get<PcBuildService>(PcBuildService);
    pcBuildModel = module.get(getModelToken(PCBuild.name));
    pcComponentModel = module.get(getModelToken(PCComponent.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBuild', () => {
    it('should create a new PC build successfully', async () => {
      const mockSavedBuild = {
        _id: mockBuildId,
        ...mockCreateDto,
        user: mockUserId,
      };

      // Mock the constructor call
      pcBuildModel.mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(mockSavedBuild),
      }));

      // Mock findById chain
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockSavedBuild),
      };
      pcBuildModel.findById = jest.fn().mockReturnValue(mockQuery);

      const result = await service.createBuild(mockCreateDto, mockUserId);

      expect(result).toEqual(mockSavedBuild);
      expect(pcBuildModel).toHaveBeenCalledWith({
        ...mockCreateDto,
        user: mockUserId,
        lang: 'vi',
      });
    });

    it('should create build with default language vi when not specified', async () => {
      const dtoWithoutLang = { ...mockCreateDto };
      delete dtoWithoutLang.lang;

      const mockSavedBuild = {
        _id: mockBuildId,
        ...dtoWithoutLang,
        user: mockUserId,
        lang: 'vi',
      };

      pcBuildModel.mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(mockSavedBuild),
      }));

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockSavedBuild),
      };
      pcBuildModel.findById = jest.fn().mockReturnValue(mockQuery);

      const result = await service.createBuild(dtoWithoutLang, mockUserId);

      expect(result.lang).toBe('vi');
      expect(pcBuildModel).toHaveBeenCalledWith({
        ...dtoWithoutLang,
        user: mockUserId,
        lang: 'vi',
      });
    });

    it('should handle creation errors properly', async () => {
      pcBuildModel.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      }));

      await expect(
        service.createBuild(mockCreateDto, mockUserId),
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateBuild', () => {
    it('should update build successfully when user owns the build', async () => {
      const mockExistingBuild = {
        _id: mockBuildId,
        user: { toString: () => mockUserId },
        ...mockPCBuild,
      };

      const mockUpdatedBuild = {
        ...mockExistingBuild,
        ...mockUpdateDto,
      };

      pcBuildModel.findById = jest.fn().mockResolvedValue(mockExistingBuild);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdatedBuild),
      };
      pcBuildModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);

      const result = await service.updateBuild(
        mockBuildId,
        mockUpdateDto,
        mockUserId,
      );

      expect(result).toEqual(mockUpdatedBuild);
      expect(pcBuildModel.findById).toHaveBeenCalledWith(mockBuildId);
      expect(pcBuildModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBuildId,
        { $set: mockUpdateDto },
        { new: true },
      );
    });

    it('should throw NotFoundException when build does not exist', async () => {
      pcBuildModel.findById = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateBuild(mockBuildId, mockUpdateDto, mockUserId),
      ).rejects.toThrow(
        new NotFoundException(`PC Build with ID ${mockBuildId} not found`),
      );

      expect(pcBuildModel.findById).toHaveBeenCalledWith(mockBuildId);
    });

    it('should throw ForbiddenException when user does not own the build', async () => {
      const differentUserId = '6507f1f77bcf86cd799439016';
      const mockExistingBuild = {
        _id: mockBuildId,
        user: { toString: () => differentUserId },
        ...mockPCBuild,
      };

      pcBuildModel.findById = jest.fn().mockResolvedValue(mockExistingBuild);

      await expect(
        service.updateBuild(mockBuildId, mockUpdateDto, mockUserId),
      ).rejects.toThrow(
        new ForbiddenException('You are not authorized to update this build'),
      );

      expect(pcBuildModel.findById).toHaveBeenCalledWith(mockBuildId);
    });

    it('should handle partial updates correctly', async () => {
      const partialUpdateDto = { name: 'Only Name Updated' };
      const mockExistingBuild = {
        _id: mockBuildId,
        user: { toString: () => mockUserId },
        ...mockPCBuild,
      };

      const mockUpdatedBuild = {
        ...mockExistingBuild,
        ...partialUpdateDto,
      };

      pcBuildModel.findById = jest.fn().mockResolvedValue(mockExistingBuild);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdatedBuild),
      };
      pcBuildModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);

      const result = await service.updateBuild(
        mockBuildId,
        partialUpdateDto,
        mockUserId,
      );

      expect(result.name).toBe('Only Name Updated');
      expect(pcBuildModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBuildId,
        { $set: partialUpdateDto },
        { new: true },
      );
    });
  });

  describe('findBuildById', () => {
    it('should return build by ID and language', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPCBuild),
      };
      pcBuildModel.findOne = jest.fn().mockReturnValue(mockQuery);

      const result = await service.findBuildById(mockBuildId, 'vi');

      expect(result).toEqual(mockPCBuild);
      expect(pcBuildModel.findOne).toHaveBeenCalledWith({
        _id: mockBuildId,
        lang: 'vi',
      });
    });

    it('should throw NotFoundException when build not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      pcBuildModel.findOne = jest.fn().mockReturnValue(mockQuery);

      await expect(service.findBuildById(mockBuildId, 'vi')).rejects.toThrow(
        new NotFoundException(
          `PC Build with ID ${mockBuildId} not found for language vi`,
        ),
      );
    });
  });

  describe('findAllBuilds', () => {
    it('should return paginated builds with specified language', async () => {
      const mockBuilds = [mockPCBuild];
      const totalCount = 1;

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockBuilds),
      };

      pcBuildModel.find = jest.fn().mockReturnValue(mockQuery);
      pcBuildModel.countDocuments = jest.fn().mockResolvedValue(totalCount);

      const result = await service.findAllBuilds(10, 1, 'vi');

      expect(result).toEqual({ builds: mockBuilds, total: totalCount });
      expect(pcBuildModel.find).toHaveBeenCalledWith({
        isPublic: true,
        lang: 'vi',
      });
      expect(pcBuildModel.countDocuments).toHaveBeenCalledWith({
        isPublic: true,
        lang: 'vi',
      });
    });

    it('should handle pagination correctly', async () => {
      const mockBuilds = [mockPCBuild];
      const totalCount = 25;
      const limit = 5;
      const page = 3;
      const expectedSkip = (page - 1) * limit; // 10

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockBuilds),
      };

      pcBuildModel.find = jest.fn().mockReturnValue(mockQuery);
      pcBuildModel.countDocuments = jest.fn().mockResolvedValue(totalCount);

      await service.findAllBuilds(limit, page, 'vi');

      expect(mockQuery.skip).toHaveBeenCalledWith(expectedSkip);
      expect(mockQuery.limit).toHaveBeenCalledWith(limit);
    });
  });

  describe('deleteBuild', () => {
    it('should delete build successfully when user owns the build', async () => {
      const mockExistingBuild = {
        _id: mockBuildId,
        user: { toString: () => mockUserId },
        ...mockPCBuild,
      };

      pcBuildModel.findById = jest.fn().mockResolvedValue(mockExistingBuild);
      pcBuildModel.findByIdAndDelete = jest
        .fn()
        .mockResolvedValue(mockExistingBuild);

      await service.deleteBuild(mockBuildId, mockUserId);

      expect(pcBuildModel.findById).toHaveBeenCalledWith(mockBuildId);
      expect(pcBuildModel.findByIdAndDelete).toHaveBeenCalledWith(mockBuildId);
    });

    it('should throw NotFoundException when build does not exist', async () => {
      pcBuildModel.findById = jest.fn().mockResolvedValue(null);

      await expect(
        service.deleteBuild(mockBuildId, mockUserId),
      ).rejects.toThrow(
        new NotFoundException(`PC Build with ID ${mockBuildId} not found`),
      );
    });

    it('should throw ForbiddenException when user does not own the build', async () => {
      const differentUserId = '6507f1f77bcf86cd799439016';
      const mockExistingBuild = {
        _id: mockBuildId,
        user: { toString: () => differentUserId },
        ...mockPCBuild,
      };

      pcBuildModel.findById = jest.fn().mockResolvedValue(mockExistingBuild);

      await expect(
        service.deleteBuild(mockBuildId, mockUserId),
      ).rejects.toThrow(
        new ForbiddenException('You are not authorized to delete this build'),
      );
    });
  });
});
