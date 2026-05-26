import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DebtsModule } from './modules/debts/debts.module';
import { ChecksModule } from './modules/checks/checks.module';

@Module({
  imports: [
    // Configuración de la conexión a PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'root',
      database: process.env.DB_NAME ?? 'bcra_consultation',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Auto-crea las tablas en base a las entidades (Desactivar en producción real)
    }),
    UsersModule,
    AuthModule,
    DebtsModule,
    ChecksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}