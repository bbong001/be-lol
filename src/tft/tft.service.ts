import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftChampion } from './schemas/tft-champion.schema';
import { TftItem } from './schemas/tft-item.schema';
import { TftComp } from './schemas/tft-comp.schema';
import { TftAugment } from './schemas/tft-augment.schema';
import { CreateTftChampionDto } from './dto/create-tft-champion.dto';
import { CreateTftItemDto } from './dto/create-tft-item.dto';
import { UpdateTftItemDto } from './dto/update-tft-item.dto';
import { CreateTftCompDto } from './dto/create-tft-comp.dto';
import { UpdateTftCompDto } from './dto/update-tft-comp.dto';
import {
  SupportedLanguage,
  validateLanguage,
  transformTftChampion,
  transformTftChampions,
  transformTftItem,
  transformTftItems,
} from './utils/i18n.util';

@Injectable()
export class TftService {
  constructor(
    @InjectModel(TftChampion.name) private tftChampionModel: Model<TftChampion>,
    @InjectModel(TftItem.name) private tftItemModel: Model<TftItem>,
    @InjectModel(TftComp.name) private tftCompModel: Model<TftComp>,
    @InjectModel(TftAugment.name) private tftAugmentModel: Model<TftAugment>,
  ) {}

  // Champions methods with i18n support
  async findAllChampions(lang?: string): Promise<any[]> {
    const validatedLang: SupportedLanguage = validateLanguage(lang);
    const champions = await this.tftChampionModel.find().lean();
    return transformTftChampions(champions, validatedLang);
  }

  async findOneChampion(id: string, lang?: string): Promise<any> {
    const validatedLang: SupportedLanguage = validateLanguage(lang);
    const champion = await this.tftChampionModel.findById(id).lean();
    if (!champion) {
      throw new NotFoundException(`TFT Champion with ID ${id} not found`);
    }
    return transformTftChampion(champion, validatedLang);
  }

  async findChampionByName(name: string, lang?: string): Promise<any> {
    const validatedLang: SupportedLanguage = validateLanguage(lang);

    // Try to find by multilingual name first
    const champion = await this.tftChampionModel
      .findOne({
        $or: [
          { 'name.en': name },
          { 'name.vi': name },
          { name: name }, // fallback for old format
        ],
      })
      .lean();

    if (!champion) {
      throw new NotFoundException(`TFT Champion with name ${name} not found`);
    }

    return transformTftChampion(champion, validatedLang);
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

  // Items methods with i18n support
  async findAllItems(lang?: string): Promise<any[]> {
    const validatedLang: SupportedLanguage = validateLanguage(lang);
    const items = await this.tftItemModel.find().lean();
    return transformTftItems(items, validatedLang);
  }

  async findOneItem(id: string, lang?: string): Promise<any> {
    const validatedLang: SupportedLanguage = validateLanguage(lang);
    const item = await this.tftItemModel.findById(id).lean();
    if (!item) {
      throw new NotFoundException(`TFT Item with ID ${id} not found`);
    }
    return transformTftItem(item, validatedLang);
  }

  async findItemByName(name: string, lang?: string): Promise<any> {
    const validatedLang: SupportedLanguage = validateLanguage(lang);

    // Try to find by multilingual name first
    const item = await this.tftItemModel
      .findOne({
        $or: [
          { 'name.en': name },
          { 'name.vi': name },
          { name: name }, // fallback for old format
        ],
      })
      .lean();

    if (!item) {
      throw new NotFoundException(`TFT Item with name ${name} not found`);
    }

    return transformTftItem(item, validatedLang);
  }

  async createItem(createTftItemDto: CreateTftItemDto): Promise<TftItem> {
    const newItem = new this.tftItemModel(createTftItemDto);
    return newItem.save();
  }

  async updateItem(
    id: string,
    updateTftItemDto: UpdateTftItemDto,
  ): Promise<TftItem> {
    const updatedItem = await this.tftItemModel
      .findByIdAndUpdate(id, updateTftItemDto, { new: true })
      .lean();
    if (!updatedItem) {
      throw new NotFoundException(`TFT Item with ID ${id} not found`);
    }
    return updatedItem;
  }

  async removeItem(id: string): Promise<void> {
    const result = await this.tftItemModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`TFT Item with ID ${id} not found`);
    }
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

  async removeComp(id: string): Promise<void> {
    const result = await this.tftCompModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`TFT Comp with ID ${id} not found`);
    }
  }
}
