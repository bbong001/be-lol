import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftChampion } from './schemas/tft-champion.schema';
import { TftItem } from './schemas/tft-item.schema';
import { TftComp } from './schemas/tft-comp.schema';
import { TftAugment } from './schemas/tft-augment.schema';
import { CreateTftChampionDto } from './dto/create-tft-champion.dto';
import { CreateTftItemDto } from './dto/create-tft-item.dto';
import { CreateTftCompDto } from './dto/create-tft-comp.dto';
import { UpdateTftCompDto } from './dto/update-tft-comp.dto';

@Injectable()
export class TftService {
  constructor(
    @InjectModel(TftChampion.name) private tftChampionModel: Model<TftChampion>,
    @InjectModel(TftItem.name) private tftItemModel: Model<TftItem>,
    @InjectModel(TftComp.name) private tftCompModel: Model<TftComp>,
    @InjectModel(TftAugment.name) private tftAugmentModel: Model<TftAugment>,
  ) {}

  // Champions methods
  async findAllChampions(): Promise<TftChampion[]> {
    return this.tftChampionModel.find().lean();
  }

  async findOneChampion(id: string): Promise<TftChampion> {
    const champion = await this.tftChampionModel.findById(id).lean();
    if (!champion) {
      throw new NotFoundException(`TFT Champion with ID ${id} not found`);
    }
    return champion;
  }

  async findChampionByName(name: string): Promise<TftChampion> {
    const champion = await this.tftChampionModel.findOne({ name }).lean();
    if (!champion) {
      throw new NotFoundException(`TFT Champion with name ${name} not found`);
    }
    return champion;
  }

  async createChampion(
    createTftChampionDto: CreateTftChampionDto,
  ): Promise<TftChampion> {
    const newChampion = new this.tftChampionModel(createTftChampionDto);
    return newChampion.save();
  }

  async updateChampion(
    id: string,
    updateData: Partial<TftChampion>,
  ): Promise<TftChampion> {
    const updatedChampion = await this.tftChampionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean();
    if (!updatedChampion) {
      throw new NotFoundException(`TFT Champion with ID ${id} not found`);
    }
    return updatedChampion;
  }

  async removeChampion(id: string): Promise<void> {
    const result = await this.tftChampionModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`TFT Champion with ID ${id} not found`);
    }
  }

  // Items methods
  async findAllItems(): Promise<TftItem[]> {
    return this.tftItemModel.find().lean();
  }

  async findOneItem(id: string): Promise<TftItem> {
    const item = await this.tftItemModel.findById(id).lean();
    if (!item) {
      throw new NotFoundException(`TFT Item with ID ${id} not found`);
    }
    return item;
  }

  async createItem(createTftItemDto: CreateTftItemDto): Promise<TftItem> {
    const newItem = new this.tftItemModel(createTftItemDto);
    return newItem.save();
  }

  // Comps methods
  async findAllComps(patch?: string): Promise<TftComp[]> {
    const query = patch ? { patch } : {};
    return this.tftCompModel.find(query).populate('champions').lean();
  }

  async findOneComp(id: string): Promise<TftComp> {
    const comp = await this.tftCompModel
      .findById(id)
      .populate('champions')
      .lean();
    if (!comp) {
      throw new NotFoundException(`TFT Comp with ID ${id} not found`);
    }
    return comp;
  }

  async createComp(createTftCompDto: CreateTftCompDto): Promise<TftComp> {
    const newComp = new this.tftCompModel(createTftCompDto);
    return newComp.save();
  }

  async updateComp(
    id: string,
    updateTftCompDto: UpdateTftCompDto,
  ): Promise<TftComp> {
    const updatedComp = await this.tftCompModel
      .findByIdAndUpdate(id, updateTftCompDto, { new: true })
      .lean();
    if (!updatedComp) {
      throw new NotFoundException(`TFT Comp with ID ${id} not found`);
    }
    return updatedComp;
  }
}
