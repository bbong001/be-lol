import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article, ArticleDocument } from './schemas/article.schema';
import { CreateArticleDto } from './dtos/create-article.dto';
import { UpdateArticleDto } from './dtos/update-article.dto';
import slugify from 'slugify';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
  ) {}

  async findAll(
    limit = 10,
    page = 1,
    lang = 'vi',
  ): Promise<{ articles: Article[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = { published: true, lang };

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name')
        .lean(),
      this.articleModel.countDocuments(filter),
    ]);

    return { articles, total };
  }

  async findBySlug(slug: string, lang = 'vi'): Promise<Article> {
    const article = await this.articleModel
      .findOne({ slug, lang, published: true })
      .populate('author', 'name')
      .lean();
    if (!article) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    // Increment view count
    await this.articleModel.updateOne(
      { slug, lang },
      { $inc: { viewCount: 1 } },
    );

    return article;
  }

  async findByTag(
    tag: string,
    limit = 10,
    page = 1,
    lang = 'vi',
  ): Promise<{ articles: Article[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = { tags: tag, published: true, lang };

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name')
        .lean(),
      this.articleModel.countDocuments(filter),
    ]);

    return { articles, total };
  }

  async create(
    createArticleDto: CreateArticleDto,
    userId: string,
  ): Promise<Article> {
    const slug =
      createArticleDto.slug || this.generateSlug(createArticleDto.title);

    // Check if slug already exists for the same language
    const existingArticle = await this.articleModel.findOne({
      slug,
      lang: createArticleDto.lang || 'vi',
    });
    if (existingArticle) {
      throw new ConflictException(
        `An article with slug "${slug}" already exists for this language`,
      );
    }

    const article = new this.articleModel({
      ...createArticleDto,
      slug,
      author: userId,
      lang: createArticleDto.lang || 'vi',
      publishedAt: createArticleDto.published ? new Date() : null,
    });

    return article.save();
  }

  private generateSlug(title: string): string {
    return slugify(title, { lower: true, strict: true });
  }

  async update(
    slug: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.articleModel.findOne({ slug });
    if (!article) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    // If title is being updated, generate new slug
    if (updateArticleDto.title) {
      const newSlug = this.generateSlug(updateArticleDto.title);
      // Check if new slug already exists (excluding current article)
      const existingArticle = await this.articleModel.findOne({
        slug: newSlug,
        _id: { $ne: article._id },
      });
      if (existingArticle) {
        throw new ConflictException(
          `An article with slug "${newSlug}" already exists`,
        );
      }
      updateArticleDto.slug = newSlug;
    }

    // If published status is changing to true, set publishedAt
    if (updateArticleDto.published === true && !article.published) {
      updateArticleDto.publishedAt = new Date();
    }

    const updatedArticle = await this.articleModel
      .findOneAndUpdate({ slug }, { $set: updateArticleDto }, { new: true })
      .populate('author', 'name')
      .lean();

    return updatedArticle;
  }

  async delete(slug: string): Promise<void> {
    const result = await this.articleModel.deleteOne({ slug });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }
  }

  async findAllAdmin(
    limit = 10,
    page = 1,
    lang?: string,
  ): Promise<{ articles: Article[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = lang ? { lang } : {};

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name')
        .lean(),
      this.articleModel.countDocuments(filter),
    ]);

    return { articles, total };
  }
}
