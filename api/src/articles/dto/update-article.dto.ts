import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @Length(3, 100)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(10, 500)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  body?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
