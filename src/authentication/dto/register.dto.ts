import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User full name',
    minLength: 3,
    example: 'John Doe',
  })
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description:
      'User password (must contain at least one letter, one number, and one special character)',
    minLength: 8,
    example: 'P@ssword123',
  })
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/[A-Za-z]/, {
    message: 'Password must contain at least one letter.',
  })
  @Matches(/\d/, { message: 'Password must contain at least one number.' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password must contain at least one special character.',
  })
  password: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
