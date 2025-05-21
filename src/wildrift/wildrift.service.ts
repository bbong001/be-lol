import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WrChampion } from './schemas/wr-champion.schema';
import { WrItem } from './schemas/wr-item.schema';
import { WrRune } from './schemas/wr-rune.schema';
import { WrGuide } from './schemas/wr-guide.schema';
import { WrChampionBuild } from './schemas/wr-champion-build.schema';
import { CreateWrChampionDto } from './dto/create-wr-champion.dto';
import { UpdateWrChampionDto } from './dto/update-wr-champion.dto';
import { CreateWrItemDto } from './dto/create-wr-item.dto';
import { CreateWrGuideDto } from './dto/create-wr-guide.dto';
import { UpdateWrGuideDto } from './dto/update-wr-guide.dto';
import { WrChampionBuildDto } from './dto/wr-champion-build.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@Injectable()
export class WildriftService {
  constructor(
    @InjectModel(WrChampion.name) private wrChampionModel: Model<WrChampion>,
    @InjectModel(WrItem.name) private wrItemModel: Model<WrItem>,
    @InjectModel(WrRune.name) private wrRuneModel: Model<WrRune>,
    @InjectModel(WrGuide.name) private wrGuideModel: Model<WrGuide>,
    @InjectModel(WrChampionBuild.name)
    private wrChampionBuildModel: Model<WrChampionBuild>,
  ) {}

  // Champions methods
  async findAllChampions(
    paginationDto?: PaginationDto,
    role?: string,
  ): Promise<PaginatedResponseDto<WrChampion>> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortDirection = 'asc',
    } = paginationDto || {};
    const skip = (page - 1) * limit;
    const query = role ? { roles: { $in: [role] } } : {};

    const sort = sortBy
      ? { [sortBy]: sortDirection === 'asc' ? 1 : -1 }
      : undefined;

    const [items, total] = await Promise.all([
      this.wrChampionModel
        .find(query)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.wrChampionModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async getAllChampionsWithBuilds(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<any>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortDirection = 'asc',
    } = paginationDto || {};
    const skip = (page - 1) * limit;

    const sort = { [sortBy]: sortDirection === 'asc' ? 1 : -1 };

    const [champions, total] = await Promise.all([
      this.wrChampionModel
        .find()
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.wrChampionModel.countDocuments(),
    ]);

    const championIds = champions.map((champion) => champion._id.toString());

    const builds = await this.wrChampionBuildModel
      .find({ championId: { $in: championIds } })
      .lean();

    const buildsByChampionId = {};
    builds.forEach((build) => {
      const championId = build.championId.toString();
      if (!buildsByChampionId[championId]) {
        buildsByChampionId[championId] = [];
      }
      buildsByChampionId[championId].push(build);
    });

    const items = champions.map((champion) => {
      const championId = champion._id.toString();
      return {
        ...champion,
        builds: buildsByChampionId[championId] || [],
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOneChampion(id: string): Promise<WrChampion> {
    const champion = await this.wrChampionModel.findById(id).lean();
    if (!champion) {
      throw new NotFoundException(`Wild Rift Champion with ID ${id} not found`);
    }
    return champion;
  }

  async getChampionWithBuilds(id: string): Promise<any> {
    const champion = await this.wrChampionModel.findById(id).lean();
    if (!champion) {
      throw new NotFoundException(`Wild Rift Champion with ID ${id} not found`);
    }

    const builds = await this.wrChampionBuildModel
      .find({ championId: id })
      .lean();

    return {
      ...champion,
      builds,
    };
  }

  async createChampion(
    createWrChampionDto: CreateWrChampionDto,
  ): Promise<WrChampion> {
    const newChampion = new this.wrChampionModel(createWrChampionDto);
    return newChampion.save();
  }

  async updateChampion(
    id: string,
    updateWrChampionDto: UpdateWrChampionDto,
  ): Promise<WrChampion> {
    const updatedChampion = await this.wrChampionModel
      .findByIdAndUpdate(id, updateWrChampionDto, { new: true })
      .lean();
    if (!updatedChampion) {
      throw new NotFoundException(`Wild Rift Champion with ID ${id} not found`);
    }
    return updatedChampion;
  }

  async removeChampion(id: string): Promise<void> {
    const result = await this.wrChampionModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Wild Rift Champion with ID ${id} not found`);
    }
  }

  // Champion Builds methods
  async findChampionBuilds(
    championId: string,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<WrChampionBuild>> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortDirection = 'asc',
    } = paginationDto || {};
    const skip = (page - 1) * limit;
    const query = { championId };

    const sort = sortBy
      ? { [sortBy]: sortDirection === 'asc' ? 1 : -1 }
      : undefined;

    const [items, total] = await Promise.all([
      this.wrChampionBuildModel
        .find(query)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.wrChampionBuildModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findChampionBuildById(id: string): Promise<WrChampionBuild> {
    const build = await this.wrChampionBuildModel.findById(id).lean();
    if (!build) {
      throw new NotFoundException(`Champion Build with ID ${id} not found`);
    }
    return build;
  }

  async createChampionBuild(
    championBuildDto: WrChampionBuildDto,
  ): Promise<WrChampionBuild> {
    const newBuild = new this.wrChampionBuildModel(championBuildDto);
    return newBuild.save();
  }

  async updateChampionBuild(
    id: string,
    championBuildDto: Partial<WrChampionBuildDto>,
  ): Promise<WrChampionBuild> {
    const updatedBuild = await this.wrChampionBuildModel
      .findByIdAndUpdate(id, championBuildDto, { new: true })
      .lean();
    if (!updatedBuild) {
      throw new NotFoundException(`Champion Build with ID ${id} not found`);
    }
    return updatedBuild;
  }

  async removeChampionBuild(id: string): Promise<void> {
    const result = await this.wrChampionBuildModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Champion Build with ID ${id} not found`);
    }
  }

  // Items methods
  async findAllItems(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<WrItem>> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortDirection = 'asc',
    } = paginationDto || {};
    const skip = (page - 1) * limit;

    const sort = sortBy
      ? { [sortBy]: sortDirection === 'asc' ? 1 : -1 }
      : undefined;

    const [items, total] = await Promise.all([
      this.wrItemModel
        .find()
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.wrItemModel.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOneItem(id: string): Promise<WrItem> {
    const item = await this.wrItemModel.findById(id).lean();
    if (!item) {
      throw new NotFoundException(`Wild Rift Item with ID ${id} not found`);
    }
    return item;
  }

  async createItem(createWrItemDto: CreateWrItemDto): Promise<WrItem> {
    const newItem = new this.wrItemModel(createWrItemDto);
    return newItem.save();
  }

  // Guides methods
  async findAllGuides(
    paginationDto?: PaginationDto,
    championId?: string,
  ): Promise<PaginatedResponseDto<WrGuide>> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortDirection = 'asc',
    } = paginationDto || {};
    const skip = (page - 1) * limit;
    const query = championId ? { championId } : {};

    const sort = sortBy
      ? { [sortBy]: sortDirection === 'asc' ? 1 : -1 }
      : undefined;

    const [items, total] = await Promise.all([
      this.wrGuideModel
        .find(query)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .populate('championId')
        .lean(),
      this.wrGuideModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOneGuide(id: string): Promise<WrGuide> {
    const guide = await this.wrGuideModel
      .findById(id)
      .populate('championId')
      .lean();

    if (!guide) {
      throw new NotFoundException(`Wild Rift Guide with ID ${id} not found`);
    }
    return guide;
  }

  async createGuide(createWrGuideDto: CreateWrGuideDto): Promise<WrGuide> {
    const newGuide = new this.wrGuideModel(createWrGuideDto);
    return newGuide.save();
  }

  async updateGuide(
    id: string,
    updateWrGuideDto: UpdateWrGuideDto,
  ): Promise<WrGuide> {
    const updatedGuide = await this.wrGuideModel
      .findByIdAndUpdate(id, updateWrGuideDto, { new: true })
      .lean();
    if (!updatedGuide) {
      throw new NotFoundException(`Wild Rift Guide with ID ${id} not found`);
    }
    return updatedGuide;
  }
}
