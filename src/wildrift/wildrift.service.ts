import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WrChampion } from './schemas/wr-champion.schema';
import { WrItem } from './schemas/wr-item.schema';
import { WrRune } from './schemas/wr-rune.schema';
import { WrGuide } from './schemas/wr-guide.schema';
import { CreateWrChampionDto } from './dto/create-wr-champion.dto';
import { UpdateWrChampionDto } from './dto/update-wr-champion.dto';
import { CreateWrItemDto } from './dto/create-wr-item.dto';
import { UpdateWrItemDto } from './dto/update-wr-item.dto';
import { CreateWrGuideDto } from './dto/create-wr-guide.dto';
import { UpdateWrGuideDto } from './dto/update-wr-guide.dto';

@Injectable()
export class WildriftService {
  constructor(
    @InjectModel(WrChampion.name) private wrChampionModel: Model<WrChampion>,
    @InjectModel(WrItem.name) private wrItemModel: Model<WrItem>,
    @InjectModel(WrRune.name) private wrRuneModel: Model<WrRune>,
    @InjectModel(WrGuide.name) private wrGuideModel: Model<WrGuide>,
  ) {}

  // Champions methods
  async findAllChampions(role?: string): Promise<WrChampion[]> {
    const query = role ? { roles: { $in: [role] } } : {};
    return this.wrChampionModel.find(query).lean();
  }

  async findOneChampion(id: string): Promise<WrChampion> {
    const champion = await this.wrChampionModel.findById(id).lean();
    if (!champion) {
      throw new NotFoundException(`Wild Rift Champion with ID ${id} not found`);
    }
    return champion;
  }

  async createChampion(createWrChampionDto: CreateWrChampionDto): Promise<WrChampion> {
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

  // Items methods
  async findAllItems(): Promise<WrItem[]> {
    return this.wrItemModel.find().lean();
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
  async findAllGuides(championId?: string): Promise<WrGuide[]> {
    const query = championId ? { championId } : {};
    return this.wrGuideModel.find(query).populate('championId').lean();
  }

  async findOneGuide(id: string): Promise<WrGuide> {
    const guide = await this.wrGuideModel.findById(id).populate('championId').lean();
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