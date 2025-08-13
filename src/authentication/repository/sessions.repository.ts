import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from '../entities/sessions.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async create(session: Partial<Session>): Promise<Session> {
    const newUser = new this.sessionModel(session);
    return newUser.save();
  }

  async findByToken(token: string): Promise<Session | null> {
    return this.sessionModel.findOne({ token }).exec();
  }

  async findByUserId(id: string) {
    return this.sessionModel.find({ user: id }).exec();
  }

  async deleteByUserId(id: string) {
    return this.sessionModel.deleteMany({ user: id }).exec();
  }

  async deleteByToken(token: string) {
    return this.sessionModel.deleteOne({ token }).exec();
  }

  async deleteExpiredSessions(userId: string, expirationTime: number) {
    const now = new Date();
    now.setTime(now.getTime() - expirationTime);

    return this.sessionModel
      .deleteMany({ user: userId, updatedAt: { $lt: now } })
      .exec();
  }
}
