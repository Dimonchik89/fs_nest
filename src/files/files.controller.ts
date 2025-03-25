import {
	Controller,
	Delete,
	FileTypeValidator,
	Get,
	Headers,
	HttpCode,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	Post,
	Query,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import {
	FILE_NOT_FOUND,
	FILE_NOT_FOUND_EXAMPLE,
	FILE_IS_REQUIRED_EXAMPLE,
	FILE_SUCCESSFULLY_DELETED_EXAMPLE,
	FILE_UPLOAD_SUCCESSFULLY_EXAMPLE,
	FILE_VALIDATION_FAILED_EXAMPLE,
	GET_USER_FILES_SUCCESS_EXAMPLE,
} from './files.constants';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { FileUploadDto } from './dto/file.dto';
import { BAD_REQUEST, UNAUTHORIZED_EXAMPLE } from '../app.constants';

@ApiTags('files')
@Controller('files')
export class FilesController {
	constructor(private readonly filesService: FilesService) {}

	@ApiOperation({ summary: 'Uploading file' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Form with file',
		type: FileUploadDto,
	})
	@ApiResponse({
		status: 200,
		description: 'File uploaded successfully',
		example: FILE_UPLOAD_SUCCESSFULLY_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: BAD_REQUEST,
		examples: {
			FILE_IS_REQUIRE: FILE_IS_REQUIRED_EXAMPLE,
			FILE_VALIDATION_FAILED: FILE_VALIDATION_FAILED_EXAMPLE,
		},
	})
	@ApiBearerAuth('access_token')
	@HttpCode(201)
	@Post('upload')
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor('file'))
	uploadFile(
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					// new MaxFileSizeValidator({ maxSize: 1000 })
					new FileTypeValidator({ fileType: '.(pdf|png)' }),
				],
			}),
		)
		file: Express.Multer.File,
		@Headers('Authorization') bearerToken: string,
	) {
		return this.filesService.uploadFile(file, bearerToken);
	}

	@ApiOperation({ summary: 'Remove file' })
	@ApiResponse({
		status: 200,
		description: 'Success',
		example: FILE_SUCCESSFULLY_DELETED_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: BAD_REQUEST,
		example: FILE_NOT_FOUND_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiBearerAuth('access_token')
	@Delete('delete/:id')
	@HttpCode(200)
	@UseGuards(JwtAuthGuard)
	deleteFile(@Param('id') id: string) {
		return this.filesService.deleteFile(id);
	}

	@ApiOperation({ summary: 'Get all user files' })
	@ApiQuery({ name: 'page', required: false, description: 'Page number' })
	@ApiResponse({
		status: 200,
		description: 'Get user files',
		example: GET_USER_FILES_SUCCESS_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiBearerAuth('access_token')
	@UseGuards(JwtAuthGuard)
	@HttpCode(200)
	@Get()
	getAllUserFiles(
		@Headers('Authorization') bearerToken: string,
		@Query('page') page: string,
	) {
		return this.filesService.getAllUserFiles(bearerToken, page);
	}

	@ApiOperation({ summary: 'Download file' })
	@ApiResponse({
		status: 200,
		description: 'Downloading file',
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: BAD_REQUEST,
		example: FILE_NOT_FOUND_EXAMPLE,
	})
	@UseGuards(JwtAuthGuard)
	@Get('download/:id')
	async downloadFile(@Param('id') id: string, @Res() res) {
		const { file, fileName } = await this.filesService.downloadFile(id);

		res.setHeader('Content-disposition', 'attachment; filename=' + fileName);

		return res.send(file);
	}
}
