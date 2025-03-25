import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { path } from 'app-root-path';
import { fileProviders } from './file.provider';

@Module({
	imports: [
		ServeStaticModule.forRoot({
			rootPath: `${path}/uploads`,
		}),
	],
	controllers: [FilesController],
	providers: [FilesService, ...fileProviders],
	exports: [FilesService],
})
export class FilesModule {}
