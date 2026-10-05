import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  /** Register a new user — hash password, return JWT + user */
  async register(dto: RegisterDto) {
    const existingUser = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('That email is already registered.');
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      password: hash,
    });

    const token = this.createToken(user.id);
    return {
      token,
      user: { id: user.id, email: user.email },
    };
  }

  /** Verify credentials and return JWT + user */
  async login(dto: LoginDto) {
    // Same generic error for wrong email or password (security: don't leak which one is wrong)
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException('Email or password is wrong.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Email or password is wrong.');
    }

    const token = this.createToken(user.id);
    return {
      token,
      user: { id: user.id, email: user.email },
    };
  }

  /** Get current user info from token payload */
  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('Session expired. Log in again.');
    }
    return { id: user.id, email: user.email };
  }

  private createToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}
