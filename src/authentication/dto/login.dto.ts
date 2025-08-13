import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: "The user's email address",
    example: 'user@example.com',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "The user's password",
    example: 'SecurePass123456#',
    required: true,
  })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
