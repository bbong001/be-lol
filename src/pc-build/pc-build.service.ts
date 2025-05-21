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

  // PC Build methods
  async findAllBuilds(
    limit = 10,
    page = 1,
  ): Promise<{ builds: PCBuild[]; total: number }> {
    const skip = (page - 1) * limit;
    const [builds, total] = await Promise.all([
      this.pcBuildModel
        .find({ isPublic: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name')
        .lean(),
      this.pcBuildModel.countDocuments({ isPublic: true }),
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

  async findUserBuilds(userId: string): Promise<PCBuild[]> {
    return this.pcBuildModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async createBuild(createPCBuildDto: any, userId: string): Promise<PCBuild> {
    const build = new this.pcBuildModel({
      ...createPCBuildDto,
      user: userId,
    });
    await build.save();
    return (
      this.pcBuildModel
        .findById(build._id)
        .populate('user', 'name')
        // .populate('components.component')
        .lean()
    );
  }

  async updateBuild(
    id: string,
    updatePCBuildDto: any,
    userId: string,
  ): Promise<PCBuild> {
    const build = await this.pcBuildModel.findById(id);

    if (!build) {
      throw new NotFoundException(`PC Build with ID ${id} not found`);
    }

    if (build.user.toString() !== userId) {
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

  async deleteBuild(id: string, userId: string): Promise<void> {
    const build = await this.pcBuildModel.findById(id);

    if (!build) {
      throw new NotFoundException(`PC Build with ID ${id} not found`);
    }

    if (build.user.toString() !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this build',
      );
    }

    await this.pcBuildModel.findByIdAndDelete(id);
  }
}
