import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
	@ApiProperty({ example: 'user@gmail.com' })
	email: string;

	@ApiProperty({ example: 'free' })
	subscription: string;

	@ApiProperty({ example: 50 })
	maxFolderSize: number;
}
