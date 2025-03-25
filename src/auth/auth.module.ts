import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseModule } from '../database/database.module';
import { userProviders } from '../user/user.providers';
import { FilesModule } from '../files/files.module';
import { jwtConstants } from './auth.constants';

@Module({
	controllers: [AuthController],
	imports: [
		ConfigModule,
		// JwtModule.register({
		// 	global: true,
		// 	secret: jwtConstants.secret,
		// 	signOptions: { expiresIn: '24h' },
		// }),
		PassportModule,
		DatabaseModule,
		FilesModule,
	],
	providers: [AuthService, JwtStrategy, ...userProviders],
})
export class AuthModule {}
