import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { UserRepository } from '../repository/user.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SessionsRepository } from '../repository/sessions.repository';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionRepository: SessionsRepository,
  ) {}

  async register(data: RegisterDto) {
    this.logger.log(`Registering new user with email: ${data.email}`);

    await this.ensureUserDoesNotExist(data.email);
    const hashedPassword = await this.passwordService.hash(data.password);

    try {
      const createdUser = await this.userRepository.create({
        name: data.name,
        email: data.email,
        password: hashedPassword,
      });

      const refresh_token = this.tokenService.generateRefreshToken(createdUser.id);
      const access_token = this.tokenService.generateAccessToken(createdUser.id);

      await this.sessionRepository.create({
        user: createdUser,
        token: refresh_token,
      });

      this.logger.log(`User created successfully: ${createdUser.id}`);

      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Error creating user. Please try again later.',
      );
    }
  }

  private async ensureUserDoesNotExist(email: string) {
    this.logger.debug(`Checking if user exists with email: ${email}`);
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`User with email ${email} already exists.`);
      throw new BadRequestException('User already exists.');
    }
  }
}
