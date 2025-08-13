import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  async getUserInfo(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async login(loginData: LoginDto) {
    const { email, password } = loginData;

    // Validate user credentials
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.sessionService.cleanupExpiredSessions(user.id);

    const refresh_token = this.tokenService.generateRefreshToken(user.id);
    const access_token = this.tokenService.generateAccessToken(user.id);

    await this.sessionService.deleteByUserId(user.id);
    await this.sessionService.createSession(user, refresh_token);

    return { access_token, refresh_token };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isMatch = await this.passwordService.compare(password, user.password);
    if (!isMatch) {
      return null;
    }

    return user;
  }

  async logout(refreshToken: string) {
    await this.sessionService.validateSession(refreshToken);
    await this.sessionService.deleteByToken(refreshToken);
    this.logger.log('User logged out successfully');
    return { message: 'Logged out successfully' };
  }



  async refreshToken(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new BadRequestException('Refresh token is required');
      }

      await this.sessionService.validateSession(refreshToken);

      let decoded;
      try {
        decoded = this.tokenService.verifyToken(refreshToken, true);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Refresh token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid refresh token');
        }
        throw new InternalServerErrorException('Token verification failed');
      }

      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newAccessToken = this.tokenService.generateAccessToken(user.id);
      const newRefreshToken = this.tokenService.generateRefreshToken(user.id);

      await this.sessionService.deleteByUserId(user.id);
      await this.sessionService.createSession(user, newRefreshToken);

      return { access_token: newAccessToken, refresh_token: newRefreshToken };
    } catch (error) {
      this.logger.error('Refresh Token Error:', error);
      throw error instanceof UnauthorizedException ||
        error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('An unexpected error occurred');
    }
  }


}
