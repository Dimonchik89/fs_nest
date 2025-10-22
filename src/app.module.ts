import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FilesModule } from './files/files.module';
import { JwtModule } from '@nestjs/jwt';
import { StripeModule } from './stripe/stripe.module';
import { DatabaseModule } from './database/database.module';
import { PostsModule } from './posts/posts.module';
import jwtConfig from './auth/config/jwt.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
	imports: [
		// JwtModule.register({
		// 	global: true,
		// 	secret: process.env.JWT_SECRET,
		// 	signOptions: { expiresIn: process.env.JWT_EXPIRE_IN },
		// }),
		// JwtModule.registerAsync(jwtConfig.asProvider()),
		// JwtModule.registerAsync(jwtConfig.asProvider()),
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, '..', '..', 'uploads'),
			serveRoot: '/uploads',
		}),
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		AuthModule,
		FilesModule,
		StripeModule,
		DatabaseModule,
		PostsModule,
	],
})
export class AppModule {}
