import { IsNotEmpty, IsString, Length, MaxLength } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @Length(3, 100)
  title: string;

  @IsString()
  @Length(10, 500)
  summary: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  body: string;
}
