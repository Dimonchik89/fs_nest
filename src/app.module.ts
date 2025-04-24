import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FilesModule } from './files/files.module';
import { JwtModule } from '@nestjs/jwt';
import { StripeModule } from './stripe/stripe.module';
import { DatabaseModule } from './database/database.module';
import jwtConfig from './auth/config/jwt.config';

@Module({
	imports: [
		// JwtModule.register({
		// 	global: true,
		// 	secret: process.env.JWT_SECRET,
		// 	signOptions: { expiresIn: process.env.JWT_EXPIRE_IN },
		// }),
		// JwtModule.registerAsync(jwtConfig.asProvider()),
		// JwtModule.registerAsync(jwtConfig.asProvider()),
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		AuthModule,
		FilesModule,
		StripeModule,
		DatabaseModule, // убрал подключение с auth.module и перенес сяда
	],
})
export class AppModule {}
