import {
	Controller,
	Delete,
	FileTypeValidator,
	Get,
	Headers,
	HttpCode,
	Param,
	ParseFilePipe,
	Post,
	Query,
	Req,
	Res,
	UnauthorizedException,
	UploadedFile,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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
	FILE_NOT_FOUND_EXAMPLE,
	FILE_IS_REQUIRED_EXAMPLE,
	FILE_SUCCESSFULLY_DELETED_EXAMPLE,
	FILE_UPLOAD_SUCCESSFULLY_EXAMPLE,
	FILE_VALIDATION_FAILED_EXAMPLE,
	GET_USER_FILES_SUCCESS_EXAMPLE,
	FILE_NOT_FOUND,
} from './files.constants';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { FileUploadDto } from './dto/file.dto';
import { BAD_REQUEST, UNAUTHORIZED_EXAMPLE } from '../app.constants';
import { UNAUTHORIZED_ERROR } from '../auth/auth.constants';
import { Response } from 'express';
import { createReadStream } from 'fs'

@ApiTags('files')
@Controller('files')
export class FilesController {
	constructor(private readonly filesService: FilesService) {}

	@ApiOperation({
		summary:
			'Uploading file. Add an access_token to be able to send a file to your directory',
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		// description: 'Form with file',
		// type: FileUploadDto,
		schema: {
            type: 'object',
            properties: {
                file: { // Имя поля должно соответствовать 'file' в FilesInterceptor
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        },
	})
	@ApiResponse({
		status: 201,
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
	@ApiResponse({
		status: 401,
		description: UNAUTHORIZED_ERROR,
		example: UNAUTHORIZED_EXAMPLE,
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('access_token')
	@HttpCode(201)
	@Post('upload')
	// @UseInterceptors(FileInterceptor('file'))
	@UseInterceptors(FilesInterceptor('file'))
	uploadFiles(
		@UploadedFiles(
			new ParseFilePipe({
				validators: [
					// new MaxFileSizeValidator({ maxSize: 1000 })
					// new FileTypeValidator({ fileType: '.(pdf|png)' }),
				],
				fileIsRequired: true
			}),
		)
		files: Array<Express.Multer.File>,
		@Headers('Authorization') bearerToken: string,
		@Req() req: any,
	) {
		// return this.filesService.uploadFiles(files, bearerToken);
		return this.filesService.uploadFiles(files, req.user);
	}

	@ApiOperation({
		summary:
			'Remove file. Add an access_token to be able to delete a file in your directory',
	})
	@ApiResponse({
		status: 200,
		description: 'Success',
		example: FILE_SUCCESSFULLY_DELETED_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: BAD_REQUEST,
		examples: {
			FILE_NOT_FOUND_EXAMPLE,
			FILE_VALIDATION_FAILED_EXAMPLE,
		},
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiBearerAuth('access_token')
	@HttpCode(200)
	@UseGuards(JwtAuthGuard)
	@Delete('delete/:id')
	deleteFile(@Param('id') id: string, @Req() req) {
		return this.filesService.deleteFile(id, req.user.id);
	}

	@ApiOperation({
		summary:
			'Get all user files. Add access_token to see all files in your directory',
	})
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
	getAllUserFiles(@Query('page') page: string, @Req() req) {
		return this.filesService.getAllUserFiles(req.user.id, page);
	}

	// @ApiOperation({ summary: 'Download file. Add access_token to download file' })
	// @ApiResponse({
	// 	status: 200,
	// 	description: 'Downloading file',
	// })
	// @ApiResponse({
	// 	status: 401,
	// 	description: 'Unauthorized',
	// 	example: UNAUTHORIZED_EXAMPLE,
	// })
	// @ApiResponse({
	// 	status: 400,
	// 	description: BAD_REQUEST,
	// 	examples: {
	// 		FILE_NOT_FOUND_EXAMPLE,
	// 	},
	// })
	// @UseGuards(JwtAuthGuard)
	// @ApiBearerAuth('access_token')
	// @Get('download/:id')
	// async downloadFile(@Param('id') id: string, @Req() req, @Res() res) {
	// 	const { file, fileName } = await this.filesService.downloadFile(
	// 		id,
	// 		req.user.id,
	// 	);

	// 	res.setHeader('Content-disposition', 'attachment; filename=' + fileName);

	// 	return res.send(file);
	// }


    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access_token')
    @ApiOperation({ summary: 'Download a file by ID. Add access_token to download file' })
    @ApiResponse({ status: 200, description: 'File downloaded successfully', type: 'string' })
    @ApiResponse({ status: 400, description: BAD_REQUEST, examples: { FILE_NOT_FOUND_EXAMPLE } })
    @ApiResponse({ status: 401, description: UNAUTHORIZED_ERROR, example: UNAUTHORIZED_EXAMPLE })
	@Get('download/:id')
    async downloadFile(
        @Param('id') id: string,
        @Req() req: any,
        @Res() res: Response,
    ) {		
        const { filePath, fileName } = await this.filesService.downloadFile(id, req.user.id);

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const fileStream = createReadStream(filePath);
        fileStream.pipe(res); // Перенаправляем поток файла прямо в ответ

        fileStream.on('error', (err) => {
            console.error('Error streaming file:', err);
            
            if (!res.headersSent) {
                res.status(500).send('Error downloading file.');
            }
        });
    }
}
