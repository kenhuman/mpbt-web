import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

export interface ArticleRow {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body: string;
  author_id: number;
  author_username: string;
  published: boolean;
  published_at: Date;
  created_at: Date;
}

@Injectable()
export class ArticlesService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Public list — only published articles. */
  async listArticles(limit = 5): Promise<Omit<ArticleRow, 'body'>[]> {
    const result = await this.pool.query<Omit<ArticleRow, 'body'>>(
      `SELECT a.id, a.slug, a.title, a.summary, a.author_id, a.published,
              acc.username AS author_username, a.published_at, a.created_at
       FROM articles a
       JOIN accounts acc ON acc.id = a.author_id
       WHERE a.published = TRUE
       ORDER BY a.published_at DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  /** Admin list — all articles including drafts. */
  async listAllArticles(): Promise<Omit<ArticleRow, 'body'>[]> {
    const result = await this.pool.query<Omit<ArticleRow, 'body'>>(
      `SELECT a.id, a.slug, a.title, a.summary, a.author_id, a.published,
              acc.username AS author_username, a.published_at, a.created_at
       FROM articles a
       JOIN accounts acc ON acc.id = a.author_id
       ORDER BY a.created_at DESC`,
    );
    return result.rows;
  }

  async getBySlug(slug: string): Promise<ArticleRow> {
    const result = await this.pool.query<ArticleRow>(
      `SELECT a.id, a.slug, a.title, a.summary, a.body, a.author_id, a.published,
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

  async getById(id: number): Promise<ArticleRow> {
    const result = await this.pool.query<ArticleRow>(
      `SELECT a.id, a.slug, a.title, a.summary, a.body, a.author_id, a.published,
              acc.username AS author_username, a.published_at, a.created_at
       FROM articles a
       JOIN accounts acc ON acc.id = a.author_id
       WHERE a.id = $1`,
      [id],
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
    const published = dto.published ?? false;
    const result = await this.pool.query<ArticleRow>(
      `INSERT INTO articles (slug, title, summary, body, author_id, published)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, slug, title, summary, body, author_id, published, published_at, created_at`,
      [slug, dto.title, dto.summary, dto.body, authorId, published],
    );
    return { ...result.rows[0], author_username: '' };
  }

  async updateArticle(id: number, dto: UpdateArticleDto): Promise<ArticleRow> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (dto.title !== undefined)     { fields.push(`title = $${idx++}`);     values.push(dto.title); }
    if (dto.summary !== undefined)   { fields.push(`summary = $${idx++}`);   values.push(dto.summary); }
    if (dto.body !== undefined)      { fields.push(`body = $${idx++}`);      values.push(dto.body); }
    if (dto.published !== undefined) { fields.push(`published = $${idx++}`); values.push(dto.published); }

    if (fields.length === 0) return this.getById(id);

    values.push(id);
    const result = await this.pool.query<ArticleRow>(
      `UPDATE articles SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, slug, title, summary, body, author_id, published, published_at, created_at`,
      values,
    );
    if (!result.rowCount || result.rowCount === 0)
      throw new NotFoundException('Article not found');
    return { ...result.rows[0], author_username: '' };
  }

  async deleteArticle(id: number): Promise<void> {
    const result = await this.pool.query('DELETE FROM articles WHERE id = $1', [id]);
    if (!result.rowCount || result.rowCount === 0)
      throw new NotFoundException('Article not found');
  }
}
