import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionsRepository } from '../repository/sessions.repository';
import { User } from '../entities/users.entity';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly EXPIRATION_TIME = 60 * 60 * 1000;

  constructor(
    private readonly sessionRepository: SessionsRepository,
  ) {}

  async createSession(user: User, refreshToken: string): Promise<void> {
    this.logger.debug(`Creating new session for user ID: ${user.id}`);
    await this.sessionRepository.create({
      user: user,
      token: refreshToken,
    });
  }

  
  async validateSession(refreshToken: string) {
    this.logger.debug('Validating session by refresh token');
    const session = await this.sessionRepository.findByToken(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid session or already logged out');
    }
    return session;
  }

  async deleteByToken(refreshToken: string): Promise<void> {
    this.logger.debug('Deleting session by token');
    await this.sessionRepository.deleteByToken(refreshToken);
  }


  async deleteByUserId(userId: string): Promise<void> {
    this.logger.debug(`Deleting sessions for user ID: ${userId}`);
    await this.sessionRepository.deleteByUserId(userId);
  }

  async cleanupExpiredSessions(userId: string): Promise<void> {
    this.logger.debug(`Cleaning expired sessions for user ID: ${userId}`);
    await this.sessionRepository.deleteExpiredSessions(
      userId,
      this.EXPIRATION_TIME,
    );
  }
}
