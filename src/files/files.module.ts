import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { path } from 'app-root-path';
import { fileProviders } from './file.provider';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from '../auth/config/jwt.config';

@Module({
	imports: [
		ServeStaticModule.forRoot({
			rootPath: `${path}/uploads`,
		}),
		JwtModule.registerAsync(jwtConfig.asProvider()),
	],
	controllers: [FilesController],
	providers: [FilesService, ...fileProviders],
	exports: [FilesService],
})
export class FilesModule {}
