import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
	@ApiProperty({
		type: 'string',
		format: 'binary',
		required: true,
		description: 'File type flp or zip',
	})
	file: any;
}
