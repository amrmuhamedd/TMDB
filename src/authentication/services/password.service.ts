import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly saltRounds = 12;

  
  async hash(password: string): Promise<string> {
    this.logger.debug('Hashing user password');
    return await bcrypt.hash(password, this.saltRounds);
  }

  async compare(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    this.logger.debug('Comparing password hash');
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  }
}
