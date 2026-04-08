import { IsEmail, IsString, Length } from 'class-validator';

export class SetupDto {
  @IsString()
  @Length(3, 64)
  username: string;

  @IsString()
  @Length(8, 64)
  password: string;

  @IsEmail()
  email: string;
}
