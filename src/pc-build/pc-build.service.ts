import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PCComponent,
  PCComponentDocument,
} from './schemas/pc-component.schema';
import { PCBuild, PCBuildDocument } from './schemas/pc-build.schema';
import { CreatePCBuildDto } from './dtos/create-pc-build.dto';
import { UpdatePCBuildDto } from './dtos/update-pc-build.dto';

@Injectable()
export class PcBuildService {
  constructor(
    @InjectModel(PCComponent.name)
    private pcComponentModel: Model<PCComponentDocument>,
    @InjectModel(PCBuild.name) private pcBuildModel: Model<PCBuildDocument>,
  ) {}

  // Component methods
  async findAllComponents(): Promise<PCComponent[]> {
    return this.pcComponentModel.find().lean();
  }

  async findComponentsByType(type: string): Promise<PCComponent[]> {
    return this.pcComponentModel.find({ type }).lean();
  }

  async findComponentById(id: string): Promise<PCComponent> {
    const component = await this.pcComponentModel.findById(id).lean();
    if (!component) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }
    return component;
  }

  // PC Build methods with language support
  async findAllBuilds(
    limit = 10,
    page = 1,
    lang = 'vi',
  ): Promise<{ builds: PCBuild[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = { isPublic: true, lang };

    const [builds, total] = await Promise.all([
      this.pcBuildModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name')
        .lean(),
      this.pcBuildModel.countDocuments(filter),
    ]);

    return { builds, total };
  }

  async findBuildById(id: string): Promise<PCBuild> {
    const build = await this.pcBuildModel
      .findById(id)
      .populate('user', 'name')
      .lean();

    if (!build) {
      throw new NotFoundException(`PC Build with ID ${id} not found`);
    }

    return build;
  }

  async findUserBuilds(userId: string, lang?: string): Promise<PCBuild[]> {
    const filter: any = { user: userId };
    if (lang) {
      filter.lang = lang;
    }

    return this.pcBuildModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findByTag(
    tag: string,
    limit = 10,
    page = 1,
    lang = 'vi',
  ): Promise<{ builds: PCBuild[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = { tags: tag, isPublic: true, lang };

    const [builds, total] = await Promise.all([
      this.pcBuildModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name')
        .lean(),
      this.pcBuildModel.countDocuments(filter),
    ]);

    return { builds, total };
  }

  async createBuild(
    createPCBuildDto: CreatePCBuildDto,
    userId: string,
  ): Promise<PCBuild> {
    const build = new this.pcBuildModel({
      ...createPCBuildDto,
      user: userId,
      lang: createPCBuildDto.lang || 'vi',
    });
    await build.save();
    return this.pcBuildModel
      .findById(build._id)
      .populate('user', 'name')
      .lean();
  }

  async updateBuild(
    id: string,
    updatePCBuildDto: UpdatePCBuildDto,
    userId: string,
    userRoles?: string[],
  ): Promise<PCBuild> {
    const build = await this.pcBuildModel.findById(id);

    if (!build) {
      throw new NotFoundException(`PC Build with ID ${id} not found`);
    }

    // Admin có thể update bất kỳ build nào, user chỉ có thể update build của mình
    const isAdmin = userRoles && userRoles.includes('admin');
    const isOwner = build.user.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You are not authorized to update this build',
      );
    }

    const updatedBuild = await this.pcBuildModel
      .findByIdAndUpdate(id, { $set: updatePCBuildDto }, { new: true })
      .populate('user', 'name')
      .lean();

    return updatedBuild;
  }

  async deleteBuild(
    id: string,
    userId: string,
    userRoles?: string[],
  ): Promise<void> {
    const build = await this.pcBuildModel.findById(id);

    if (!build) {
      throw new NotFoundException(`PC Build with ID ${id} not found`);
    }

    // Admin có thể delete bất kỳ build nào, user chỉ có thể delete build của mình
    const isAdmin = userRoles && userRoles.includes('admin');
    const isOwner = build.user.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You are not authorized to delete this build',
      );
    }

    await this.pcBuildModel.findByIdAndDelete(id);
  }

  // Admin methods
  async findAllBuildsAdmin(
    limit = 10,
    page = 1,
    lang?: string,
  ): Promise<{ builds: PCBuild[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = lang ? { lang } : {};

    const [builds, total] = await Promise.all([
      this.pcBuildModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name')
        .lean(),
      this.pcBuildModel.countDocuments(filter),
    ]);

    return { builds, total };
  }
}
