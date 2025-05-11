import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article, ArticleDocument } from './schemas/article.schema';
import { CreateArticleDto } from './dtos/create-article.dto';
import slugify from 'slugify';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
  ) {}

  async findAll(
    limit = 10,
    page = 1,
  ): Promise<{ articles: Article[]; total: number }> {
    const skip = (page - 1) * limit;
    const [articles, total] = await Promise.all([
      this.articleModel
        .find({ published: true })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name')
        .lean(),
      this.articleModel.countDocuments({ published: true }),
    ]);

    return { articles, total };
  }

  async findBySlug(slug: string): Promise<Article> {
    const article = await this.articleModel
      .findOne({ slug, published: true })
      .populate('author', 'name')
      .lean();
    if (!article) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }
    return article;
  }

  async findByTag(
    tag: string,
    limit = 10,
    page = 1,
  ): Promise<{ articles: Article[]; total: number }> {
    const skip = (page - 1) * limit;
    const [articles, total] = await Promise.all([
      this.articleModel
        .find({ tags: tag, published: true })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name')
        .lean(),
      this.articleModel.countDocuments({ tags: tag, published: true }),
    ]);

    return { articles, total };
  }

  async create(
    createArticleDto: CreateArticleDto,
    userId: string,
  ): Promise<Article> {
    const slug =
      createArticleDto.slug || this.generateSlug(createArticleDto.title);

    // Check if slug already exists
    const existingArticle = await this.articleModel.findOne({ slug });
    if (existingArticle) {
      throw new ConflictException(
        `An article with slug "${slug}" already exists`,
      );
    }

    const article = new this.articleModel({
      ...createArticleDto,
      slug,
      author: userId,
      publishedAt: createArticleDto.published ? new Date() : null,
    });

    return article.save();
  }

  private generateSlug(title: string): string {
    return slugify(title, { lower: true, strict: true });
  }
}
