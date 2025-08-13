import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

 
  generateAccessToken(userId: string): string {
    this.logger.debug(`Generating access token for user ID: ${userId}`);
    return this.jwtService.sign(
      { id: userId },
      { 
        secret: this.configService.get<string>('JWT_SECRET'), 
        expiresIn: '1h' 
      },
    );
  }

  generateRefreshToken(userId: string): string {
    this.logger.debug(`Generating refresh token for user ID: ${userId}`);
    return this.jwtService.sign(
      { id: userId },
      { 
        secret: this.configService.get<string>('RT_SECRET'), 
        expiresIn: '7d' 
      },
    );
  }

  verifyToken(token: string, isRefreshToken: boolean = false): any {
    const secret = isRefreshToken 
      ? this.configService.get<string>('RT_SECRET')
      : this.configService.get<string>('JWT_SECRET');
      
    try {
      return this.jwtService.verify(token, { secret });
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw error;
    }
  }
}
