import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      // Clave secreta para firmar los tokens. 
      // En producción usaremos process.env.JWT_SECRET, por ahora dejamos un fallback para local
      secret: process.env.JWT_SECRET ?? 'CLAVE_SECRETA_SUPER_COMPLICADA_WURTH_2026',
      signOptions: { expiresIn: '8h' }, // Expiración del token
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }