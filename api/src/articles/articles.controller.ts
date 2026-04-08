import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard, AuthGuard, AuthRequest } from '../auth/guards';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  /** Public list — published articles only. */
  @Get()
  list(@Query('limit') limit?: string) {
    const n = Math.min(parseInt(limit ?? '5', 10) || 5, 20);
    return this.articlesService.listArticles(n);
  }

  /** Admin list — all articles including drafts (static route before :slug). */
  @Get('admin')
  @UseGuards(AuthGuard, AdminGuard)
  listAll() {
    return this.articlesService.listAllArticles();
  }

  @Get(':slug')
  getOne(@Param('slug') slug: string) {
    return this.articlesService.getBySlug(slug);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateArticleDto, @Req() req: AuthRequest) {
    return this.articlesService.createArticle(dto, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArticleDto) {
    return this.articlesService.updateArticle(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.deleteArticle(id);
  }
}
