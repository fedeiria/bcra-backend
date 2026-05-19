import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { APP_CONFIG } from '../common/constants/app-config';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: APP_CONFIG.jwt.secret, // <-- Parametrizado
      signOptions: { expiresIn: APP_CONFIG.jwt.expiresIn }, // <-- Parametrizado
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }