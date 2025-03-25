import { ApiProperty } from '@nestjs/swagger';
import { IsString, isEmail } from 'class-validator';

export class AuthDto {
	@ApiProperty({
		description: 'User email',
		example: 'test@gmail.com',
	})
	@IsString()
	login: string;

	@ApiProperty({
		description: 'User password',
		example: 'password123',
	})
	@IsString()
	password: string;
}
