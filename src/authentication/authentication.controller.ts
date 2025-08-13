import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Res,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { RegistrationService } from './services/registration.service';
import { RegisterDto } from './dto/register.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { LoggedInUser } from './decorators/get-current-user';
import { User } from './entities/users.entity';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../shared/guards/jwtauth.guard';

@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly registrationService: RegistrationService
  ) {}

  private setRefreshTokenCookie(response: Response, token: string): void {
    response.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description:
      'User successfully registered. Refresh token is set in HTTP-only cookie.',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.registrationService.register(registerDto);

    this.setRefreshTokenCookie(response, result.refresh_token);

    return { access_token: result.access_token };
  }

  @Post('/login')
  @ApiOperation({ summary: 'Login and get an access token' })
  @ApiResponse({
    status: 200,
    description: 'Successful login. Refresh token is set in HTTP-only cookie.',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authenticationService.login(loginDto);

    this.setRefreshTokenCookie(response, result.refresh_token);

    return { access_token: result.access_token };
  }

  @Post('/refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Refresh token',
    description: 'Refresh access token using the refresh token from cookies (or for testing in Swagger, from request body)'
  })
  @ApiResponse({
    status: 200,
    description:
      'Return the new access token and updates refresh token in HTTP-only cookie.',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid refresh token.' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token not found.',
  })
  @ApiResponse({ status: 404, description: 'User is not logged in.' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      // In production, we only use cookies for security
      let refreshToken = request.cookies?.['refresh_token'];
      
      console.log({cookies: request.cookies});
      // For Swagger testing only - allow reading from headers if cookie not found
      if (!refreshToken) {
        refreshToken = request.headers?.['refresh-token'] as string;
      }
      
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const result = await this.authenticationService.refreshToken(refreshToken);
      
      if (!result) {
        throw new InternalServerErrorException('Failed to refresh token');
      }

      this.setRefreshTokenCookie(response, result.refresh_token);
      
      return { access_token: result.access_token };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes("Cannot read properties")) {
        throw new InternalServerErrorException('Invalid response from authentication service');
      }
      throw error;
    }
  }

  @Post('/logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'logout' })
  @ApiResponse({ status: 404, description: 'user is not logged in.' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authenticationService.logout(refreshToken);

    response.clearCookie('refresh_token');

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/me')
  @HttpCode(200)
  @ApiOperation({ summary: 'logout' })
  @ApiResponse({ status: 404, description: 'user is not logged in.' })
  async getUserInfo(@LoggedInUser() user: Partial<User>) {
    return this.authenticationService.getUserInfo(user.id);
  }
}
