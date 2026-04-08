import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { CreateArticleDto } from './dto/create-article.dto';

export interface ArticleRow {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body: string;
  author_id: number;
  author_username: string;
  published_at: Date;
  created_at: Date;
}

@Injectable()
export class ArticlesService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listArticles(limit = 5): Promise<Omit<ArticleRow, 'body'>[]> {
    const result = await this.pool.query<Omit<ArticleRow, 'body'>>(
      `SELECT a.id, a.slug, a.title, a.summary, a.author_id,
              acc.username AS author_username, a.published_at, a.created_at
       FROM articles a
       JOIN accounts acc ON acc.id = a.author_id
       ORDER BY a.published_at DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  async getBySlug(slug: string): Promise<ArticleRow> {
    const result = await this.pool.query<ArticleRow>(
      `SELECT a.id, a.slug, a.title, a.summary, a.body, a.author_id,
              acc.username AS author_username, a.published_at, a.created_at
       FROM articles a
       JOIN accounts acc ON acc.id = a.author_id
       WHERE a.slug = $1`,
      [slug],
    );
    if (!result.rowCount || result.rowCount === 0)
      throw new NotFoundException('Article not found');
    return result.rows[0];
  }

  async createArticle(dto: CreateArticleDto, authorId: number): Promise<ArticleRow> {
    const slug =
      dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now();
    const result = await this.pool.query<ArticleRow>(
      `INSERT INTO articles (slug, title, summary, body, author_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, slug, title, summary, body, author_id, published_at, created_at`,
      [slug, dto.title, dto.summary, dto.body, authorId],
    );
    return { ...result.rows[0], author_username: '' };
  }
}
