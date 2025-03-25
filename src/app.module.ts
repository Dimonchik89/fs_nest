import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from './files/files.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth/auth.constants';

@Module({
	imports: [
		JwtModule.register({
			global: true,
			secret: jwtConstants.secret,
			signOptions: { expiresIn: '24h' },
		}),
		ConfigModule.forRoot(),
		AuthModule,
		FilesModule,
	],
})
export class AppModule {}
