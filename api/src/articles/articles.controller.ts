import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard, AuthGuard, AuthRequest } from '../auth/guards';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    const n = Math.min(parseInt(limit ?? '5', 10) || 5, 20);
    return this.articlesService.listArticles(n);
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
}
