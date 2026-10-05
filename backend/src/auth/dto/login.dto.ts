import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email: string;

  @MinLength(8, { message: 'Use at least 8 characters.' })
  password: string;
}
